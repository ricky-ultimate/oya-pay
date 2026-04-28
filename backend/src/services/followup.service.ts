import prisma from "../config/db.config";
import {
  FollowUpChannel,
  FollowUpTemplate,
  InvoiceStatus,
} from "../generated/prisma/client";
import { sendEmail } from "./email.service";
import { sendWhatsAppMessage } from "./whatsapp.service";
import {
  getFollowUpEmailTemplate,
  getFollowUpWhatsAppTemplate,
} from "./followup.templates";
import type { TemplateData } from "./followup.templates";
import logger from "../utils/logger.utils";

export const scheduleFollowUpsForInvoice = async (
  invoiceId: string,
): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });

  if (!invoice) return;

  const dueDate = new Date(invoice.dueDate);
  const now = new Date();

  const definitions = [
    {
      template: FollowUpTemplate.PRE_DUE_REMINDER,
      scheduledAt: new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      template: FollowUpTemplate.FIRST_OVERDUE,
      scheduledAt: new Date(dueDate.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      template: FollowUpTemplate.SECOND_OVERDUE,
      scheduledAt: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      template: FollowUpTemplate.FINAL_NOTICE,
      scheduledAt: new Date(dueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  const channels: FollowUpChannel[] = [FollowUpChannel.EMAIL];
  if (invoice.client.phone) channels.push(FollowUpChannel.WHATSAPP);

  const toCreate = definitions
    .filter((d) => d.scheduledAt > now)
    .flatMap((d) =>
      channels.map((channel) => ({
        invoiceId,
        channel,
        template: d.template,
        scheduledAt: d.scheduledAt,
      })),
    );

  if (toCreate.length > 0) {
    await prisma.followUpSchedule.createMany({ data: toCreate });
  }
};

export const cancelFollowUpsForInvoice = async (
  invoiceId: string,
): Promise<void> => {
  await prisma.followUpSchedule.updateMany({
    where: { invoiceId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
};

export const markOverdueInvoices = async (): Promise<void> => {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      status: InvoiceStatus.PENDING,
      dueDate: { lt: now },
    },
    data: { status: InvoiceStatus.OVERDUE },
  });

  if (result.count > 0) {
    logger(`Marked ${result.count} invoice(s) as overdue`);
  }
};

const buildTemplateData = (invoice: {
  invoiceNumber: string;
  total: unknown;
  currency: string;
  dueDate: Date;
  paystackRef: string | null;
  client: { name: string };
  user: { name: string; businessName: string | null };
}): TemplateData => {
  const data: TemplateData = {
    clientName: invoice.client.name,
    freelancerName: invoice.user.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: Number(invoice.total).toLocaleString("en-NG"),
    currency: invoice.currency,
    dueDate: new Date(invoice.dueDate).toLocaleDateString("en-NG"),
  };

  if (invoice.user.businessName !== null) {
    data.businessName = invoice.user.businessName;
  }

  if (invoice.paystackRef !== null) {
    data.payLink = `https://paystack.com/pay/${invoice.paystackRef}`;
  }

  return data;
};

export const processDueFollowUps = async (): Promise<void> => {
  const now = new Date();

  const due = await prisma.followUpSchedule.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    include: {
      invoice: { include: { client: true, user: true } },
    },
  });

  for (const schedule of due) {
    const invoice = schedule.invoice;

    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      await prisma.followUpSchedule.update({
        where: { id: schedule.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const templateData = buildTemplateData(invoice);

    let success = false;
    let message = "";

    if (schedule.channel === FollowUpChannel.EMAIL) {
      const tpl = getFollowUpEmailTemplate(schedule.template, templateData);
      message = tpl.subject;
      success = await sendEmail({
        to: invoice.client.email,
        subject: tpl.subject,
        html: tpl.html,
      });
    } else if (
      schedule.channel === FollowUpChannel.WHATSAPP &&
      invoice.client.phone
    ) {
      message = getFollowUpWhatsAppTemplate(schedule.template, templateData);
      success = await sendWhatsAppMessage(invoice.client.phone, message);
    }

    await prisma.followUpSchedule.update({
      where: { id: schedule.id },
      data: { status: success ? "SENT" : "FAILED", sentAt: new Date() },
    });

    await prisma.followUpLog.create({
      data: {
        invoiceId: invoice.id,
        channel: schedule.channel,
        message,
        status: success ? "SENT" : "FAILED",
      },
    });

    logger(
      `Follow-up ${success ? "sent" : "failed"}: ${schedule.template} via ${schedule.channel} for ${invoice.invoiceNumber}`,
    );
  }
};
