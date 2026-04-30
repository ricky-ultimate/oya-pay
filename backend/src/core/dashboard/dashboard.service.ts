import prisma from "../../config/db.config";
import { InvoiceStatus, FollowUpStatus } from "../../generated/prisma/client";

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

const getMonthlyRevenue = async (userId: string) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const payments = await prisma.payment.findMany({
    where: { invoice: { userId }, paidAt: { gte: sixMonthsAgo } },
    select: { amount: true, paidAt: true },
  });

  const monthly: Record<string, number> = {};

  for (const payment of payments) {
    const key = payment.paidAt.toISOString().substring(0, 7);
    monthly[key] = (monthly[key] ?? 0) + Number(payment.amount);
  }

  return Object.entries(monthly)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const getTopOverdueClients = async (userId: string) => {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: {
        in: [
          InvoiceStatus.OVERDUE,
          InvoiceStatus.PENDING,
          InvoiceStatus.PARTIAL,
        ],
      },
    },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const clientMap = new Map<
    string,
    {
      clientId: string;
      name: string;
      email: string;
      phone: string | null;
      totalOutstanding: number;
      invoiceCount: number;
      oldestDueDays: number;
      mostOverdueInvoiceId: string;
    }
  >();

  const now = new Date();

  for (const inv of overdueInvoices) {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(inv.total) - paid;
    if (outstanding <= 0) continue;

    const dueDays = Math.round(
      (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    const existing = clientMap.get(inv.clientId);
    if (existing) {
      existing.totalOutstanding += outstanding;
      existing.invoiceCount += 1;
      if (dueDays > existing.oldestDueDays) {
        existing.oldestDueDays = dueDays;
        existing.mostOverdueInvoiceId = inv.id;
      }
    } else {
      clientMap.set(inv.clientId, {
        clientId: inv.clientId,
        name: inv.client.name,
        email: inv.client.email,
        phone: inv.client.phone,
        totalOutstanding: outstanding,
        invoiceCount: 1,
        oldestDueDays: Math.max(dueDays, 0),
        mostOverdueInvoiceId: inv.id,
      });
    }
  }

  return Array.from(clientMap.values())
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
    .slice(0, 5);
};

const getRecoveryStats = async (
  userId: string,
): Promise<{ totalRecovered: number; unprotectedOutstanding: number }> => {
  const [allLogs, allPayments, activeFollowUpRows, outstandingInvoices] =
    await Promise.all([
      prisma.followUpLog.findMany({
        where: { invoice: { userId }, status: "SENT" },
        select: { invoiceId: true, sentAt: true },
      }),
      prisma.payment.findMany({
        where: { invoice: { userId } },
        select: { invoiceId: true, amount: true, paidAt: true },
      }),
      prisma.followUpSchedule.findMany({
        where: {
          invoice: { userId },
          status: { in: [FollowUpStatus.PENDING, FollowUpStatus.PAUSED] },
        },
        select: { invoiceId: true },
        distinct: ["invoiceId"],
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          status: {
            in: [
              InvoiceStatus.PENDING,
              InvoiceStatus.PARTIAL,
              InvoiceStatus.OVERDUE,
            ],
          },
        },
        include: { payments: { select: { amount: true } } },
      }),
    ]);

  const logsByInvoice = new Map<string, Date[]>();
  for (const log of allLogs) {
    const arr = logsByInvoice.get(log.invoiceId) ?? [];
    arr.push(log.sentAt);
    logsByInvoice.set(log.invoiceId, arr);
  }

  let totalRecovered = 0;
  for (const payment of allPayments) {
    const logDates = logsByInvoice.get(payment.invoiceId) ?? [];
    const windowStart = new Date(payment.paidAt.getTime() - RECOVERY_WINDOW_MS);
    const hasFollowUp = logDates.some(
      (d) => d >= windowStart && d <= payment.paidAt,
    );
    if (hasFollowUp) {
      totalRecovered += Number(payment.amount);
    }
  }

  const activeInvoiceIds = new Set(activeFollowUpRows.map((r) => r.invoiceId));
  let unprotectedOutstanding = 0;
  for (const inv of outstandingInvoices) {
    if (activeInvoiceIds.has(inv.id)) continue;
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(inv.total) - paid;
    if (outstanding > 0) unprotectedOutstanding += outstanding;
  }

  return { totalRecovered, unprotectedOutstanding };
};

const getPipelineStats = async (
  userId: string,
): Promise<{
  pendingCollection: number;
  atRiskAmount: number;
  agentsActive: number;
  needsAttention: Array<{
    invoiceId: string;
    invoiceNumber: string;
    title: string;
    clientName: string;
    clientId: string;
    amount: number;
    daysOverdue: number;
    reason: "no_sequence" | "failed_send" | "sequence_paused";
  }>;
  nextFollowUp: {
    invoiceId: string;
    invoiceNumber: string;
    title: string;
    clientName: string;
    template: string;
    channel: string;
    scheduledAt: string;
  } | null;
}> => {
  const now = new Date();
  const atRiskThresholdDays = 14;

  const [
    outstandingInvoices,
    activeSequenceRows,
    pendingSchedules,
    failedLogs,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId,
        status: {
          in: [
            InvoiceStatus.PENDING,
            InvoiceStatus.PARTIAL,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.followUpSchedule.findMany({
      where: {
        invoice: { userId },
        status: { in: [FollowUpStatus.PENDING, FollowUpStatus.PAUSED] },
      },
      select: { invoiceId: true, status: true },
      distinct: ["invoiceId"],
    }),
    prisma.followUpSchedule.findMany({
      where: {
        invoice: { userId },
        status: FollowUpStatus.PENDING,
        scheduledAt: { gt: now },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            title: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 1,
    }),
    prisma.followUpLog.findMany({
      where: {
        invoice: { userId },
        status: "FAILED",
      },
      select: { invoiceId: true },
      distinct: ["invoiceId"],
    }),
  ]);

  const activeSequenceByInvoice = new Map(
    activeSequenceRows.map((r) => [r.invoiceId, r.status]),
  );
  const failedInvoiceIds = new Set(failedLogs.map((l) => l.invoiceId));

  let pendingCollection = 0;
  let atRiskAmount = 0;
  const needsAttention: Array<{
    invoiceId: string;
    invoiceNumber: string;
    title: string;
    clientName: string;
    clientId: string;
    amount: number;
    daysOverdue: number;
    reason: "no_sequence" | "failed_send" | "sequence_paused";
  }> = [];

  for (const inv of outstandingInvoices) {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(inv.total) - paid;
    if (outstanding <= 0) continue;

    pendingCollection += outstanding;

    const daysOverdue =
      inv.status === InvoiceStatus.OVERDUE
        ? Math.round(
            (now.getTime() - new Date(inv.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    if (daysOverdue >= atRiskThresholdDays) {
      atRiskAmount += outstanding;
    }

    const sequenceStatus = activeSequenceByInvoice.get(inv.id);
    const hasFailedSend =
      failedInvoiceIds.has(inv.id) && sequenceStatus === undefined;

    if (sequenceStatus === undefined && !hasFailedSend) {
      needsAttention.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        clientName: inv.client.name,
        clientId: inv.client.id,
        amount: outstanding,
        daysOverdue,
        reason: "no_sequence",
      });
    } else if (hasFailedSend) {
      needsAttention.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        clientName: inv.client.name,
        clientId: inv.client.id,
        amount: outstanding,
        daysOverdue,
        reason: "failed_send",
      });
    } else if (sequenceStatus === FollowUpStatus.PAUSED) {
      needsAttention.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        clientName: inv.client.name,
        clientId: inv.client.id,
        amount: outstanding,
        daysOverdue,
        reason: "sequence_paused",
      });
    }
  }

  needsAttention.sort((a, b) => b.amount - a.amount);

  const agentsActive = activeSequenceRows.filter(
    (r) => r.status === FollowUpStatus.PENDING,
  ).length;

  const nextSchedule = pendingSchedules[0];
  const nextFollowUp = nextSchedule
    ? {
        invoiceId: nextSchedule.invoice.id,
        invoiceNumber: nextSchedule.invoice.invoiceNumber,
        title: nextSchedule.invoice.title,
        clientName: nextSchedule.invoice.client.name,
        template: nextSchedule.template,
        channel: nextSchedule.channel,
        scheduledAt: nextSchedule.scheduledAt.toISOString(),
      }
    : null;

  return {
    pendingCollection,
    atRiskAmount,
    agentsActive,
    needsAttention: needsAttention.slice(0, 5),
    nextFollowUp,
  };
};

export const getDashboardStats = async (userId: string) => {
  const [
    totalInvoices,
    statusCounts,
    totalRevenue,
    outstanding,
    recentInvoices,
    monthlyRevenue,
    topOverdueClients,
    recoveryStats,
    pipelineStats,
  ] = await Promise.all([
    prisma.invoice.count({ where: { userId } }),

    prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),

    prisma.payment.aggregate({
      where: { invoice: { userId } },
      _sum: { amount: true },
    }),

    prisma.invoice.aggregate({
      where: {
        userId,
        status: {
          in: [
            InvoiceStatus.PENDING,
            InvoiceStatus.PARTIAL,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
      _sum: { total: true },
    }),

    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { name: true } },
        followUpSchedules: {
          where: {
            status: { in: [FollowUpStatus.PENDING, FollowUpStatus.PAUSED] },
          },
          select: { id: true, status: true },
          take: 1,
        },
      },
    }),

    getMonthlyRevenue(userId),
    getTopOverdueClients(userId),
    getRecoveryStats(userId),
    getPipelineStats(userId),
  ]);

  const statusMap = statusCounts.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    overview: {
      totalInvoices,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      outstandingAmount: Number(outstanding._sum.total ?? 0),
      totalRecovered: recoveryStats.totalRecovered,
      unprotectedOutstanding: recoveryStats.unprotectedOutstanding,
      pendingCollection: pipelineStats.pendingCollection,
      atRiskAmount: pipelineStats.atRiskAmount,
      agentsActive: pipelineStats.agentsActive,
      statusBreakdown: {
        draft: statusMap["DRAFT"] ?? 0,
        pending: statusMap["PENDING"] ?? 0,
        partial: statusMap["PARTIAL"] ?? 0,
        paid: statusMap["PAID"] ?? 0,
        overdue: statusMap["OVERDUE"] ?? 0,
        cancelled: statusMap["CANCELLED"] ?? 0,
      },
    },
    recentInvoices,
    monthlyRevenue,
    topOverdueClients,
    needsAttention: pipelineStats.needsAttention,
    nextFollowUp: pipelineStats.nextFollowUp,
  };
};
