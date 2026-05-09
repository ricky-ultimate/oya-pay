import prisma from "../config/db.config";
import {
  FollowUpChannel,
  FollowUpTemplate,
  FollowUpStatus,
  InvoiceStatus,
} from "../generated/prisma/client";
import { sendEmail } from "./email.service";
import { sendWhatsAppMessage } from "./whatsapp.service";
import {
  getFollowUpEmailTemplate,
  getFollowUpWhatsAppTemplate,
} from "./followup.templates";
import type { TemplateData } from "./followup.templates";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

export interface FollowUpStep {
  template: FollowUpTemplate;
  offsetDays: number;
  channels: FollowUpChannel[];
  enabled: boolean;
}

export const buildDefaultSteps = (hasPhone: boolean): FollowUpStep[] => {
  const channels: FollowUpChannel[] = hasPhone
    ? [FollowUpChannel.EMAIL, FollowUpChannel.WHATSAPP]
    : [FollowUpChannel.EMAIL];

  return [
    {
      template: FollowUpTemplate.PRE_DUE_REMINDER,
      offsetDays: -3,
      channels: [...channels],
      enabled: true,
    },
    {
      template: FollowUpTemplate.FIRST_OVERDUE,
      offsetDays: 1,
      channels: [...channels],
      enabled: true,
    },
    {
      template: FollowUpTemplate.SECOND_OVERDUE,
      offsetDays: 7,
      channels: [...channels],
      enabled: true,
    },
    {
      template: FollowUpTemplate.FINAL_NOTICE,
      offsetDays: 14,
      channels: [...channels],
      enabled: true,
    },
  ];
};

export const scheduleFollowUpsForInvoice = async (
  invoiceId: string,
  steps?: FollowUpStep[],
): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });

  if (!invoice) return;

  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const resolvedSteps = steps ?? buildDefaultSteps(!!invoice.client.phone);

  const toCreate = resolvedSteps
    .filter((step) => step.enabled)
    .map((step) => ({
      scheduledAt: new Date(
        dueDate.getTime() + step.offsetDays * 24 * 60 * 60 * 1000,
      ),
      template: step.template,
      channels: step.channels,
    }))
    .filter((step) => step.scheduledAt > now)
    .flatMap((step) =>
      step.channels.map((channel) => ({
        invoiceId,
        channel,
        template: step.template,
        scheduledAt: step.scheduledAt,
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
    where: {
      invoiceId,
      status: { in: [FollowUpStatus.PENDING, FollowUpStatus.PAUSED] },
    },
    data: { status: FollowUpStatus.CANCELLED },
  });
};

export const pauseFollowUpsForInvoice = async (
  userId: string,
  invoiceId: string,
): Promise<number> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");

  const result = await prisma.followUpSchedule.updateMany({
    where: { invoiceId, status: FollowUpStatus.PENDING },
    data: { status: FollowUpStatus.PAUSED },
  });
  return result.count;
};

export const resumeFollowUpsForInvoice = async (
  userId: string,
  invoiceId: string,
): Promise<number> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw new Error("Invoice not found");

  const result = await prisma.followUpSchedule.updateMany({
    where: { invoiceId, status: FollowUpStatus.PAUSED },
    data: { status: FollowUpStatus.PENDING },
  });
  return result.count;
};

export const markOverdueInvoices = async (): Promise<void> => {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: { status: InvoiceStatus.PENDING, dueDate: { lt: now } },
    data: { status: InvoiceStatus.OVERDUE },
  });

  if (result.count > 0) {
    logger(`Marked ${result.count} invoice(s) as overdue`);
  }
};

const buildTemplateData = (invoice: {
  id: string;
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
    trackingPixelUrl: `${ENV.APP_URL}/api/track/open/${invoice.id}`,
  };

  if (invoice.user.businessName !== null) {
    data.businessName = invoice.user.businessName;
  }

  if (invoice.paystackRef !== null) {
    data.payLink = `${ENV.APP_URL}/api/track/click/${invoice.id}`;
  }

  return data;
};

export const previewFollowUpMessage = async (
  userId: string,
  invoiceId: string,
  template: FollowUpTemplate,
): Promise<{ email: { subject: string; html: string }; whatsapp: string }> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, user: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  const data = buildTemplateData(invoice);

  return {
    email: getFollowUpEmailTemplate(template, data),
    whatsapp: getFollowUpWhatsAppTemplate(template, data),
  };
};

export const triggerScheduledFollowUp = async (
  userId: string,
  scheduleId: string,
  note?: string,
): Promise<void> => {
  const schedule = await prisma.followUpSchedule.findFirst({
    where: { id: scheduleId },
    include: { invoice: { include: { client: true, user: true } } },
  });

  if (!schedule) throw new Error("Follow-up not found");
  if (schedule.invoice.userId !== userId) throw new Error("Unauthorized");
  if (
    schedule.status !== FollowUpStatus.PENDING &&
    schedule.status !== FollowUpStatus.PAUSED
  ) {
    throw new Error("Only pending or paused follow-ups can be triggered");
  }

  const invoice = schedule.invoice;
  const templateData = buildTemplateData(invoice);

  let success = false;
  let message = "";

  if (schedule.channel === FollowUpChannel.EMAIL) {
    const tpl = getFollowUpEmailTemplate(schedule.template, templateData);
    message = tpl.subject;
    const noteHtml = note
      ? `<p style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">${note}</p>`
      : "";
    success = await sendEmail({
      to: invoice.client.email,
      subject: tpl.subject,
      html: tpl.html + noteHtml,
    });
  } else if (
    schedule.channel === FollowUpChannel.WHATSAPP &&
    invoice.client.phone
  ) {
    const defaultMessage = getFollowUpWhatsAppTemplate(
      schedule.template,
      templateData,
    );
    message = note ? `${defaultMessage}\n\n${note}` : defaultMessage;
    success = await sendWhatsAppMessage(invoice.client.phone, message);
  }

  await prisma.followUpSchedule.update({
    where: { id: scheduleId },
    data: {
      status: success ? FollowUpStatus.SENT : FollowUpStatus.FAILED,
      sentAt: new Date(),
    },
  });

  await prisma.followUpLog.create({
    data: {
      invoiceId: invoice.id,
      channel: schedule.channel,
      template: schedule.template,
      message,
      status: success ? "SENT" : "FAILED",
    },
  });
};

export const escalateFollowUp = async (
  userId: string,
  invoiceId: string,
  template: FollowUpTemplate,
  channel: FollowUpChannel,
  note?: string,
): Promise<void> => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { client: true, user: true },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (
    invoice.status === InvoiceStatus.PAID ||
    invoice.status === InvoiceStatus.CANCELLED
  ) {
    throw new Error("Cannot send a follow-up for a paid or cancelled invoice");
  }

  const templateData = buildTemplateData(invoice);

  let success = false;
  let message = "";

  if (channel === FollowUpChannel.EMAIL) {
    const tpl = getFollowUpEmailTemplate(template, templateData);
    message = tpl.subject;
    const noteHtml = note
      ? `<p style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">${note}</p>`
      : "";
    success = await sendEmail({
      to: invoice.client.email,
      subject: tpl.subject,
      html: tpl.html + noteHtml,
    });
  } else if (channel === FollowUpChannel.WHATSAPP && invoice.client.phone) {
    const defaultMessage = getFollowUpWhatsAppTemplate(template, templateData);
    message = note ? `${defaultMessage}\n\n${note}` : defaultMessage;
    success = await sendWhatsAppMessage(invoice.client.phone, message);
  }

  await prisma.followUpLog.create({
    data: {
      invoiceId,
      channel,
      template,
      message,
      status: success ? "SENT" : "FAILED",
    },
  });
};

export const processDueFollowUps = async (): Promise<void> => {
  const now = new Date();

  const due = await prisma.followUpSchedule.findMany({
    where: { status: FollowUpStatus.PENDING, scheduledAt: { lte: now } },
    include: { invoice: { include: { client: true, user: true } } },
  });

  for (const schedule of due) {
    const invoice = schedule.invoice;

    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      await prisma.followUpSchedule.update({
        where: { id: schedule.id },
        data: { status: FollowUpStatus.CANCELLED },
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
      data: {
        status: success ? FollowUpStatus.SENT : FollowUpStatus.FAILED,
        sentAt: new Date(),
      },
    });

    await prisma.followUpLog.create({
      data: {
        invoiceId: invoice.id,
        channel: schedule.channel,
        template: schedule.template,
        message,
        status: success ? "SENT" : "FAILED",
      },
    });

    logger(
      `Follow-up ${success ? "sent" : "failed"}: ${schedule.template} via ${schedule.channel} for ${invoice.invoiceNumber}`,
    );
  }
};
