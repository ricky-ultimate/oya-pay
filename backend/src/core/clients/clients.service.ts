import prisma from "../../config/db.config";
import { CreateClientInput, UpdateClientInput } from "./clients.schema";
import { InvoiceStatus } from "../../generated/prisma/client";

export const createClient = async (userId: string, input: CreateClientInput) =>
  prisma.client.create({
    data: {
      userId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      address: input.address ?? null,
    },
  });

export const getClients = async (userId: string) => {
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { invoices: true } },
      invoices: {
        where: { status: InvoiceStatus.PAID },
        include: {
          payments: { orderBy: { paidAt: "asc" }, take: 1 },
        },
      },
    },
  });

  return clients.map((client) => {
    const daysLateValues: number[] = [];

    for (const inv of client.invoices) {
      const firstPayment = inv.payments[0];
      if (!firstPayment) continue;
      const diffMs =
        new Date(firstPayment.paidAt).getTime() -
        new Date(inv.dueDate).getTime();
      daysLateValues.push(Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    let reliabilityScore: ClientStats["reliabilityScore"] = "no_data";
    let avgDaysLate: number | null = null;

    if (daysLateValues.length >= 1) {
      const avg =
        daysLateValues.reduce((a, b) => a + b, 0) / daysLateValues.length;
      avgDaysLate = Math.round(avg);
      const lateCount = daysLateValues.filter((d) => d > 2).length;
      const lateRatio = lateCount / daysLateValues.length;

      if (avg <= 2 && lateRatio <= 0.2) {
        reliabilityScore = "on_time";
      } else if (lateRatio >= 0.6 || avg > 14) {
        reliabilityScore = "consistently_late";
      } else {
        reliabilityScore = "sometimes_late";
      }
    }

    const { invoices: _invoices, ...rest } = client;
    return { ...rest, reliabilityScore, avgDaysLate };
  });
};

export const getClientById = async (userId: string, clientId: string) =>
  prisma.client.findFirst({
    where: { id: clientId, userId },
    include: {
      invoices: {
        orderBy: { createdAt: "asc" },
        include: {
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

export const updateClient = async (
  userId: string,
  clientId: string,
  input: UpdateClientInput,
) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone ?? null }),
      ...(input.address !== undefined && { address: input.address ?? null }),
    },
  });
};

export const deleteClient = async (userId: string, clientId: string) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.client.delete({ where: { id: clientId } });
};

export interface ClientStats {
  avgDaysToPayment: number | null;
  avgDaysLate: number | null;
  reliabilityScore:
    | "on_time"
    | "sometimes_late"
    | "consistently_late"
    | "no_data";
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalChases: number;
}

export const getClientStats = async (
  userId: string,
  clientId: string,
): Promise<ClientStats> => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  const [invoices, followUpLogs] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId, userId },
      include: {
        payments: { orderBy: { paidAt: "asc" }, take: 1 },
      },
    }),
    prisma.followUpLog.count({
      where: { invoice: { clientId, userId }, status: "SENT" },
    }),
  ]);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(
    (inv) =>
      inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.PARTIAL,
  ).length;
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === InvoiceStatus.OVERDUE,
  ).length;

  const daysLateValues: number[] = [];

  for (const inv of invoices) {
    const firstPayment = inv.payments[0];
    if (!firstPayment) continue;

    const dueDate = new Date(inv.dueDate);
    const paidAt = new Date(firstPayment.paidAt);
    const diffMs = paidAt.getTime() - dueDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    daysLateValues.push(diffDays);
  }

  const avgDaysToPayment =
    daysLateValues.length > 0
      ? Math.round(
          daysLateValues.reduce((a, b) => a + b, 0) / daysLateValues.length,
        )
      : null;

  const avgDaysLate =
    avgDaysToPayment !== null && avgDaysToPayment > 0 ? avgDaysToPayment : null;

  let reliabilityScore: ClientStats["reliabilityScore"] = "no_data";

  if (daysLateValues.length >= 1) {
    const avg = avgDaysToPayment ?? 0;
    const lateCount = daysLateValues.filter((d) => d > 2).length;
    const lateRatio = lateCount / daysLateValues.length;

    if (avg <= 2 && lateRatio <= 0.2) {
      reliabilityScore = "on_time";
    } else if (lateRatio >= 0.6 || avg > 14) {
      reliabilityScore = "consistently_late";
    } else {
      reliabilityScore = "sometimes_late";
    }
  }

  return {
    avgDaysToPayment,
    avgDaysLate,
    reliabilityScore,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    totalChases: followUpLogs,
  };
};
