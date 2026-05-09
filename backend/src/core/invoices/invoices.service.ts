import prisma from "../../config/db.config";
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  SendInvoiceInput,
} from "./invoices.schema";
import { generateInvoiceNumber } from "../../utils/invoice-number.utils";
import { generateInvoicePDF } from "../../services/pdf.service";
import { sendEmail } from "../../services/email.service";
import { sendWhatsAppMessage } from "../../services/whatsapp.service";
import {
  scheduleFollowUpsForInvoice,
  cancelFollowUpsForInvoice,
  type FollowUpStep,
} from "../../services/followup.service";
import { initializePayment } from "../../services/paystack.service";
import {
  getFollowUpEmailTemplate,
  getFollowUpWhatsAppTemplate,
} from "../../services/followup.templates";
import {
  InvoiceStatus,
  FollowUpChannel,
  FollowUpTemplate,
  FollowUpStatus,
} from "../../generated/prisma/client";
import { ENV } from "../../constants/env";
import type { TemplateData } from "../../services/followup.templates";

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

export const createInvoice = async (
  userId: string,
  input: CreateInvoiceInput,
) => {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = subtotal + input.tax;

  return prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      title: input.title,
      userId,
      clientId: input.clientId,
      dueDate: new Date(input.dueDate),
      currency: input.currency,
      tax: input.tax,
      subtotal,
      total,
      notes: input.notes ?? null,
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, client: true },
  });
};

export const getInvoices = async (userId: string, status?: string) =>
  prisma.invoice.findMany({
    where: {
      userId,
      ...(status ? { status: status as InvoiceStatus } : {}),
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      _count: { select: { payments: true } },
      followUpSchedules: {
        where: { status: FollowUpStatus.PENDING },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

export const getInvoiceById = async (userId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      items: true,
      client: true,
      user: true,
      payments: { orderBy: { paidAt: "desc" } },
      followUpLogs: { orderBy: { sentAt: "asc" } },
      followUpSchedules: {
        where: {
          status: { in: [FollowUpStatus.PENDING, FollowUpStatus.PAUSED] },
        },
        select: { id: true, status: true },
      },
    },
  });

  if (!invoice) return null;

  let followUpAttribution: {
    followUpNumber: number;
    channel: string;
    template: string | null;
    sentAt: string;
  } | null = null;

  if (
    invoice.status === InvoiceStatus.PAID ||
    invoice.status === InvoiceStatus.PARTIAL
  ) {
    const sentLogs = invoice.followUpLogs.filter((l) => l.status === "SENT");
    const sortedPayments = [...invoice.payments].sort(
      (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
    );
    const firstPayment = sortedPayments[0];

    if (firstPayment) {
      const paidAt = new Date(firstPayment.paidAt);
      const windowStart = new Date(paidAt.getTime() - RECOVERY_WINDOW_MS);

      for (let i = 0; i < sentLogs.length; i++) {
        const log = sentLogs[i];
        if (!log) continue;
        const logDate = new Date(log.sentAt);
        if (logDate >= windowStart && logDate <= paidAt) {
          followUpAttribution = {
            followUpNumber: i + 1,
            channel: log.channel,
            template: log.template ?? null,
            sentAt: log.sentAt.toISOString(),
          };
          break;
        }
      }
    }
  }

  return { ...invoice, followUpAttribution };
};

export const updateInvoice = async (
  userId: string,
  invoiceId: string,
  input: UpdateInvoiceInput,
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== InvoiceStatus.DRAFT)
    throw new Error("Only draft invoices can be edited");

  const { items, dueDate, notes, tax, title, clientId, currency } = input;

  type ScalarUpdateFields = {
    title?: string;
    clientId?: string;
    currency?: string;
    tax?: number;
    notes?: string | null;
    dueDate?: Date;
    subtotal?: number;
    total?: number;
  };

  const scalarData: ScalarUpdateFields = {};

  if (title !== undefined) scalarData.title = title;
  if (clientId !== undefined) scalarData.clientId = clientId;
  if (currency !== undefined) scalarData.currency = currency;
  if (tax !== undefined) scalarData.tax = tax;
  if (notes !== undefined) scalarData.notes = notes ?? null;
  if (dueDate !== undefined) scalarData.dueDate = new Date(dueDate);

  if (items !== undefined) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const effectiveTax = typeof tax === "number" ? tax : Number(invoice.tax);
    scalarData.subtotal = subtotal;
    scalarData.total = subtotal + effectiveTax;

    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...scalarData,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true, client: true },
    });
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: scalarData,
    include: { items: true, client: true },
  });
};

export const deleteInvoice = async (userId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== InvoiceStatus.DRAFT)
    throw new Error("Only draft invoices can be deleted");

  await cancelFollowUpsForInvoice(invoiceId);
  return prisma.invoice.delete({ where: { id: invoiceId } });
};

const buildTemplateData = (
  invoice: {
    id: string;
    invoiceNumber: string;
    total: unknown;
    currency: string;
    dueDate: Date;
    paystackRef: string | null;
    client: { name: string; email: string; phone: string | null };
    user: { name: string; businessName: string | null };
  },
  paystackRef: string | null,
): TemplateData => {
  const base: TemplateData = {
    clientName: invoice.client.name,
    freelancerName: invoice.user.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: Number(invoice.total).toLocaleString("en-NG"),
    currency: invoice.currency,
    dueDate: new Date(invoice.dueDate).toLocaleDateString("en-NG"),
    trackingPixelUrl: `${ENV.APP_URL}/api/track/open/${invoice.id}`,
  };

  if (invoice.user.businessName !== null) {
    base.businessName = invoice.user.businessName;
  }

  if (paystackRef !== null) {
    base.payLink = `${ENV.APP_URL}/api/track/click/${invoice.id}`;
  }

  return base;
};

export const sendInvoice = async (
  userId: string,
  invoiceId: string,
  input: SendInvoiceInput,
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, user: true, items: true },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (
    invoice.status === InvoiceStatus.PAID ||
    invoice.status === InvoiceStatus.CANCELLED
  ) {
    throw new Error("Cannot send a paid or cancelled invoice");
  }

  let paystackRef = invoice.paystackRef;

  if (!paystackRef) {
    const payment = await initializePayment({
      email: invoice.client.email,
      amount: Number(invoice.total),
      reference: `OYAPAY-${invoice.invoiceNumber}-${Date.now()}`,
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
      callbackUrl: `${ENV.APP_URL}/api/webhooks/paystack`,
      subaccountCode: invoice.user.paystackSubaccountCode,
    });

    if (payment) {
      paystackRef = payment.accessCode;
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { paystackRef },
      });
    }
  }

  const pdf = await generateInvoicePDF({ ...invoice, paystackRef });
  const templateData = buildTemplateData(invoice, paystackRef);
  const results: Record<string, boolean> = {};

  if (input.channels.includes("EMAIL")) {
    const tpl = getFollowUpEmailTemplate(
      FollowUpTemplate.INVOICE_SENT,
      templateData,
    );
    results["email"] = await sendEmail({
      to: invoice.client.email,
      subject: tpl.subject,
      html: tpl.html,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }],
    });

    await prisma.followUpLog.create({
      data: {
        invoiceId,
        channel: FollowUpChannel.EMAIL,
        template: FollowUpTemplate.INVOICE_SENT,
        message: tpl.subject,
        status: results["email"] ? "SENT" : "FAILED",
      },
    });
  }
  if (input.channels.includes("WHATSAPP") && invoice.client.phone) {
    const message = getFollowUpWhatsAppTemplate(
      FollowUpTemplate.INVOICE_SENT,
      templateData,
    );
    results["whatsapp"] = await sendWhatsAppMessage(
      invoice.client.phone,
      message,
    );

    await prisma.followUpLog.create({
      data: {
        invoiceId,
        channel: FollowUpChannel.WHATSAPP,
        template: FollowUpTemplate.INVOICE_SENT,
        message,
        status: results["whatsapp"] ? "SENT" : "FAILED",
      },
    });
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.PENDING, sentAt: new Date() },
  });

  await cancelFollowUpsForInvoice(invoiceId);

  const steps: FollowUpStep[] | undefined = input.followUpConfig?.map((s) => ({
    template: s.template as FollowUpTemplate,
    offsetDays: s.offsetDays,
    channels: s.channels.map((c) => c as FollowUpChannel),
    enabled: s.enabled,
  }));

  await scheduleFollowUpsForInvoice(invoiceId, steps);

  return { results, invoiceNumber: invoice.invoiceNumber };
};

export const getInvoicePDF = async (
  userId: string,
  invoiceId: string,
): Promise<Buffer> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { items: true, client: true, user: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  return generateInvoicePDF(invoice);
};

export const updateInvoiceStatus = async (
  userId: string,
  invoiceId: string,
  status: InvoiceStatus,
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");

  if (status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED) {
    await cancelFollowUpsForInvoice(invoiceId);
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      ...(status === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
    },
  });
};

export const getOrRegeneratePaymentLink = async (
  userId: string,
  invoiceId: string,
  forceRegenerate: boolean = false,
): Promise<{ authorizationUrl: string; reference: string }> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, user: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  if (
    invoice.status === InvoiceStatus.PAID ||
    invoice.status === InvoiceStatus.CANCELLED
  ) {
    throw new Error(
      "Cannot generate a payment link for a paid or cancelled invoice",
    );
  }

  if (invoice.paystackRef && !forceRegenerate) {
    return {
      authorizationUrl: `https://checkout.paystack.com/${invoice.paystackRef}`,
      reference: invoice.paystackRef,
    };
  }

  const payment = await initializePayment({
    email: invoice.client.email,
    amount: Number(invoice.total),
    reference: `OYAPAY-${invoice.invoiceNumber}-${Date.now()}`,
    metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    callbackUrl: `${ENV.APP_URL}/api/webhooks/paystack`,
    subaccountCode: invoice.user.paystackSubaccountCode,
  });

  if (!payment) throw new Error("Failed to generate payment link");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paystackRef: payment.accessCode },
  });

  return {
    authorizationUrl: payment.authorizationUrl,
    reference: payment.accessCode,
  };
};

export const getFollowUpActivity = async (
  userId: string,
  invoiceId: string,
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");

  const [schedules, logs] = await Promise.all([
    prisma.followUpSchedule.findMany({
      where: { invoiceId },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.followUpLog.findMany({
      where: { invoiceId },
      orderBy: { sentAt: "desc" },
    }),
  ]);

  return { schedules, logs };
};

export const cancelFollowUp = async (userId: string, scheduleId: string) => {
  const schedule = await prisma.followUpSchedule.findFirst({
    where: { id: scheduleId },
    include: { invoice: { select: { userId: true } } },
  });

  if (!schedule) throw new Error("Follow-up not found");
  if (schedule.invoice.userId !== userId) throw new Error("Unauthorized");
  if (schedule.status !== "PENDING" && schedule.status !== "PAUSED")
    throw new Error("Only pending or paused follow-ups can be cancelled");

  return prisma.followUpSchedule.update({
    where: { id: scheduleId },
    data: { status: "CANCELLED" },
  });
};
