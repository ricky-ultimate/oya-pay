import { Request, Response } from "express";
import {
  verifyWebhookSignature,
  verifyPayment,
} from "../../services/paystack.service";
import { cancelFollowUpsForInvoice } from "../../services/followup.service";
import prisma from "../../config/db.config";
import { sendSuccess, sendError } from "../../utils/response.utils";
import logger from "../../utils/logger.utils";
import { InvoiceStatus } from "../../generated/prisma/client";

export const paystackWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  if (!signature) {
    sendError(res, 400, "Missing signature");
    return;
  }

  const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature);

  if (!isValid) {
    sendError(res, 401, "Invalid signature");
    return;
  }

  const event = req.body as {
    event: string;
    data?: {
      reference?: string;
      amount?: number;
      metadata?: { invoiceId?: string; invoiceNumber?: string };
    };
  };

  if (event.event !== "charge.success") {
    sendSuccess(res, 200, "Event received");
    return;
  }

  const reference = event.data?.reference;
  const invoiceId = event.data?.metadata?.invoiceId;

  if (!reference || !invoiceId) {
    sendSuccess(res, 200, "Event received");
    return;
  }

  try {
    const verified = await verifyPayment(reference);

    if (!verified) {
      logger("Paystack webhook: verification failed for", reference);
      sendSuccess(res, 200, "Event received");
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.status === InvoiceStatus.PAID) {
      sendSuccess(res, 200, "Event received");
      return;
    }

    const amountPaid = (event.data?.amount ?? 0) / 100;

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: amountPaid,
        method: "paystack",
        reference,
        note: "Payment via Paystack",
      },
    });

    const aggregate = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true },
    });

    const totalPaid = Number(aggregate._sum.amount ?? 0);
    const invoiceTotal = Number(invoice.total);

    const newStatus =
      totalPaid >= invoiceTotal ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        ...(newStatus === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
      },
    });

    if (newStatus === InvoiceStatus.PAID) {
      await cancelFollowUpsForInvoice(invoice.id);
    }

    logger("Paystack payment recorded for invoice", invoice.invoiceNumber);
    sendSuccess(res, 200, "Payment recorded");
  } catch (error) {
    logger("Webhook processing error:", error);
    sendSuccess(res, 200, "Event received");
  }
};
