import prisma from "../../config/db.config";
import { InvoiceStatus } from "../../generated/prisma/client";

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

export const getDashboardStats = async (userId: string) => {
  const [
    totalInvoices,
    statusCounts,
    totalRevenue,
    outstanding,
    recentInvoices,
    monthlyRevenue,
    topOverdueClients,
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
      include: { client: { select: { name: true } } },
    }),

    getMonthlyRevenue(userId),
    getTopOverdueClients(userId),
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
  };
};
