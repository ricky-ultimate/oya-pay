import prisma from "../config/db.config";
import { FollowUpTemplate } from "../generated/prisma/client";

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

function startOfMonth(monthsBack = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  if (monthsBack > 0) {
    d.setMonth(d.getMonth() - monthsBack);
  }
  return d;
}

export interface TemplateAnalytics {
  template: FollowUpTemplate;
  sentCount: number;
  uniqueInvoicesSent: number;
  conversions: number;
  conversionRate: number;
}

export interface ChannelAnalytics {
  channel: "EMAIL" | "WHATSAPP";
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversions: number;
  conversionRate: number;
}

export interface MonthlyTrendPoint {
  month: string;
  followUpsSent: number;
  paymentsRecovered: number;
}

export interface FollowUpAnalyticsResult {
  recoveredThisMonth: number;
  totalRecovered: number;
  totalFollowUpsSent: number;
  templateStats: TemplateAnalytics[];
  channelStats: ChannelAnalytics[];
  monthlyTrend: MonthlyTrendPoint[];
  bestPerformingTemplate: FollowUpTemplate | null;
}

export const getFollowUpAnalytics = async (
  userId: string,
): Promise<FollowUpAnalyticsResult> => {
  const thisMonthStart = startOfMonth(0);

  const [allLogs, allPayments, emailOpenRows, clickRows] = await Promise.all([
    prisma.followUpLog.findMany({
      where: { invoice: { userId }, status: "SENT" },
      select: {
        template: true,
        channel: true,
        invoiceId: true,
        sentAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { invoice: { userId } },
      select: { invoiceId: true, amount: true, paidAt: true },
    }),
    prisma.emailOpen.findMany({
      where: { invoice: { userId } },
      select: { invoiceId: true },
    }),
    prisma.payLinkClick.findMany({
      where: { invoice: { userId } },
      select: { invoiceId: true },
    }),
  ]);

  const paymentsByInvoice = new Map<
    string,
    { amount: number; paidAt: Date }[]
  >();
  for (const p of allPayments) {
    const arr = paymentsByInvoice.get(p.invoiceId) ?? [];
    arr.push({ amount: Number(p.amount), paidAt: p.paidAt });
    paymentsByInvoice.set(p.invoiceId, arr);
  }

  const openCountByInvoice = new Map<string, number>();
  for (const row of emailOpenRows) {
    openCountByInvoice.set(
      row.invoiceId,
      (openCountByInvoice.get(row.invoiceId) ?? 0) + 1,
    );
  }

  const clickCountByInvoice = new Map<string, number>();
  for (const row of clickRows) {
    clickCountByInvoice.set(
      row.invoiceId,
      (clickCountByInvoice.get(row.invoiceId) ?? 0) + 1,
    );
  }

  const totalFollowUpsSent = allLogs.length;

  const isConverted = (invoiceId: string, sentAt: Date): boolean => {
    const payments = paymentsByInvoice.get(invoiceId) ?? [];
    const windowEnd = new Date(sentAt.getTime() + RECOVERY_WINDOW_MS);
    return payments.some((p) => p.paidAt >= sentAt && p.paidAt <= windowEnd);
  };

  const logsByInvoice = new Map<string, Date[]>();
  for (const log of allLogs) {
    const arr = logsByInvoice.get(log.invoiceId) ?? [];
    arr.push(log.sentAt);
    logsByInvoice.set(log.invoiceId, arr);
  }

  const computeRecovered = (since?: Date): number => {
    const filtered = since
      ? allPayments.filter((p) => p.paidAt >= since)
      : allPayments;

    let total = 0;
    for (const payment of filtered) {
      const logDates = logsByInvoice.get(payment.invoiceId) ?? [];
      const windowStart = new Date(
        payment.paidAt.getTime() - RECOVERY_WINDOW_MS,
      );
      const hasFollowUp = logDates.some(
        (d) => d >= windowStart && d <= payment.paidAt,
      );
      if (hasFollowUp) {
        total += Number(payment.amount);
      }
    }
    return total;
  };

  const recoveredThisMonth = computeRecovered(thisMonthStart);
  const totalRecovered = computeRecovered();

  const TEMPLATE_ORDER: FollowUpTemplate[] = [
    FollowUpTemplate.INVOICE_SENT,
    FollowUpTemplate.PRE_DUE_REMINDER,
    FollowUpTemplate.FIRST_OVERDUE,
    FollowUpTemplate.SECOND_OVERDUE,
    FollowUpTemplate.FINAL_NOTICE,
  ];

  type LogGroup = {
    sentCount: number;
    invoiceIds: Set<string>;
    sends: { invoiceId: string; sentAt: Date }[];
  };

  const templateGroups = new Map<string, LogGroup>();

  for (const log of allLogs) {
    if (!log.template) continue;
    const key = log.template;
    const group = templateGroups.get(key) ?? {
      sentCount: 0,
      invoiceIds: new Set(),
      sends: [],
    };
    group.sentCount++;
    group.invoiceIds.add(log.invoiceId);
    group.sends.push({ invoiceId: log.invoiceId, sentAt: log.sentAt });
    templateGroups.set(key, group);
  }

  const templateStats: TemplateAnalytics[] = TEMPLATE_ORDER.filter((t) =>
    templateGroups.has(t),
  ).map((t) => {
    const group = templateGroups.get(t)!;
    const convertedInvoices = new Set<string>();
    for (const { invoiceId, sentAt } of group.sends) {
      if (isConverted(invoiceId, sentAt)) {
        convertedInvoices.add(invoiceId);
      }
    }
    const conversions = convertedInvoices.size;
    const uniqueInvoicesSent = group.invoiceIds.size;
    return {
      template: t,
      sentCount: group.sentCount,
      uniqueInvoicesSent,
      conversions,
      conversionRate:
        uniqueInvoicesSent > 0
          ? Math.round((conversions / uniqueInvoicesSent) * 100)
          : 0,
    };
  });

  const channelGroups = new Map<string, LogGroup>();

  for (const log of allLogs) {
    const key = log.channel;
    const group = channelGroups.get(key) ?? {
      sentCount: 0,
      invoiceIds: new Set(),
      sends: [],
    };
    group.sentCount++;
    group.invoiceIds.add(log.invoiceId);
    group.sends.push({ invoiceId: log.invoiceId, sentAt: log.sentAt });
    channelGroups.set(key, group);
  }

  const channelStats: ChannelAnalytics[] = (["EMAIL", "WHATSAPP"] as const)
    .filter((c) => channelGroups.has(c))
    .map((c) => {
      const group = channelGroups.get(c)!;
      const convertedInvoices = new Set<string>();
      for (const { invoiceId, sentAt } of group.sends) {
        if (isConverted(invoiceId, sentAt)) {
          convertedInvoices.add(invoiceId);
        }
      }
      const conversions = convertedInvoices.size;
      const uniqueInvoicesSent = group.invoiceIds.size;

      let openCount = 0;
      let clickCount = 0;

      if (c === "EMAIL") {
        for (const invoiceId of group.invoiceIds) {
          openCount += openCountByInvoice.get(invoiceId) ?? 0;
        }
      }
      for (const invoiceId of group.invoiceIds) {
        clickCount += clickCountByInvoice.get(invoiceId) ?? 0;
      }

      return {
        channel: c,
        sentCount: group.sentCount,
        openCount,
        clickCount,
        conversions,
        conversionRate:
          uniqueInvoicesSent > 0
            ? Math.round((conversions / uniqueInvoicesSent) * 100)
            : 0,
      };
    });

  const monthlyTrend: MonthlyTrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(i);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const key = start.toISOString().substring(0, 7)!;

    const sentThisMonth = allLogs.filter(
      (l) => l.sentAt >= start && l.sentAt < end,
    ).length;

    const paymentsThisMonth = allPayments.filter(
      (p) => p.paidAt >= start && p.paidAt < end,
    );

    let paymentsRecovered = 0;
    for (const payment of paymentsThisMonth) {
      const logDates = logsByInvoice.get(payment.invoiceId) ?? [];
      const windowStart = new Date(
        payment.paidAt.getTime() - RECOVERY_WINDOW_MS,
      );
      const hasFollowUp = logDates.some(
        (d) => d >= windowStart && d <= payment.paidAt,
      );
      if (hasFollowUp) {
        paymentsRecovered += Number(payment.amount);
      }
    }

    monthlyTrend.push({
      month: key,
      followUpsSent: sentThisMonth,
      paymentsRecovered,
    });
  }

  let bestPerformingTemplate: FollowUpTemplate | null = null;
  let bestRate = -1;
  for (const stat of templateStats) {
    if (stat.template === FollowUpTemplate.INVOICE_SENT) continue;
    if (stat.uniqueInvoicesSent >= 3 && stat.conversionRate > bestRate) {
      bestRate = stat.conversionRate;
      bestPerformingTemplate = stat.template;
    }
  }

  return {
    recoveredThisMonth,
    totalRecovered,
    totalFollowUpsSent,
    templateStats,
    channelStats,
    monthlyTrend,
    bestPerformingTemplate,
  };
};
