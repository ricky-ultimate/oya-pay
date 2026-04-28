import prisma from "../../config/db.config";
import { LogPaymentInput } from "./payments.schema";
import { cancelFollowUpsForInvoice } from "../../services/followup.service";
import { InvoiceStatus } from "../../generated/prisma/client";

const recalculateInvoiceStatus = async (invoiceId: string): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const aggregate = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });

  const paid = Number(aggregate._sum.amount ?? 0);
  const total = Number(invoice.total);

  let newStatus: InvoiceStatus;

  if (paid <= 0) {
    newStatus = invoice.sentAt ? InvoiceStatus.PENDING : InvoiceStatus.DRAFT;
  } else if (paid >= total) {
    newStatus = InvoiceStatus.PAID;
  } else {
    newStatus = InvoiceStatus.PARTIAL;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: newStatus,
      paidAt: newStatus === InvoiceStatus.PAID ? new Date() : null,
    },
  });

  if (newStatus === InvoiceStatus.PAID) {
    await cancelFollowUpsForInvoice(invoiceId);
  }
};

export const logPayment = async (userId: string, input: LogPaymentInput) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, userId },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error("Cannot log payment for a cancelled invoice");
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      amount: input.amount,
      method: input.method ?? null,
      reference: input.reference ?? null,
      note: input.note ?? null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
    },
  });

  await recalculateInvoiceStatus(input.invoiceId);

  return payment;
};

export const getPaymentsByInvoice = async (
  userId: string,
  invoiceId: string,
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");

  return prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paidAt: "desc" },
  });
};

export const deletePayment = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: { invoice: { select: { userId: true } } },
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.invoice.userId !== userId) throw new Error("Unauthorized");

  const invoiceId = payment.invoiceId;

  await prisma.payment.delete({ where: { id: paymentId } });
  await recalculateInvoiceStatus(invoiceId);

  return { deleted: true };
};
