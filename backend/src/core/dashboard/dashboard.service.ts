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

export const getDashboardStats = async (userId: string) => {
  const [
    totalInvoices,
    statusCounts,
    totalRevenue,
    outstanding,
    recentInvoices,
    monthlyRevenue,
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
  };
};
