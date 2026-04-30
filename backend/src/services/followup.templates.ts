export interface TemplateData {
  clientName: string;
  freelancerName: string;
  businessName?: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  payLink?: string;
  trackingPixelUrl?: string;
}

const senderName = (data: TemplateData) =>
  data.businessName ?? data.freelancerName;

const payButton = (payLink?: string) =>
  payLink
    ? `<p style="margin-top:20px"><a href="${payLink}" style="background:#4f46e5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">Pay Now</a></p>`
    : "";

const trackingPixel = (url?: string) =>
  url
    ? `<img src="${url}" width="1" height="1" style="display:none;" alt="" />`
    : "";

export const getFollowUpEmailTemplate = (
  template: string,
  data: TemplateData,
): { subject: string; html: string } => {
  const pixel = trackingPixel(data.trackingPixelUrl);

  const templates: Record<string, { subject: string; html: string }> = {
    INVOICE_SENT: {
      subject: `Invoice ${data.invoiceNumber} from ${senderName(data)}`,
      html: `<p>Hi ${data.clientName},</p><p>Please find attached your invoice <strong>${data.invoiceNumber}</strong> for <strong>${data.currency} ${data.amount}</strong>, due on <strong>${data.dueDate}</strong>.</p>${payButton(data.payLink)}<p>Thank you for your business.</p><p>${senderName(data)}</p>${pixel}`,
    },
    PRE_DUE_REMINDER: {
      subject: `Reminder: Invoice ${data.invoiceNumber} due soon`,
      html: `<p>Hi ${data.clientName},</p><p>This is a friendly reminder that invoice <strong>${data.invoiceNumber}</strong> for <strong>${data.currency} ${data.amount}</strong> is due on <strong>${data.dueDate}</strong>.</p>${payButton(data.payLink)}<p>${senderName(data)}</p>${pixel}`,
    },
    FIRST_OVERDUE: {
      subject: `Invoice ${data.invoiceNumber} is now overdue`,
      html: `<p>Hi ${data.clientName},</p><p>Invoice <strong>${data.invoiceNumber}</strong> for <strong>${data.currency} ${data.amount}</strong> was due on <strong>${data.dueDate}</strong> and has not yet been settled. Please arrange payment at your earliest convenience.</p>${payButton(data.payLink)}<p>${senderName(data)}</p>${pixel}`,
    },
    SECOND_OVERDUE: {
      subject: `Second notice: Invoice ${data.invoiceNumber} overdue`,
      html: `<p>Hi ${data.clientName},</p><p>We have not yet received payment for invoice <strong>${data.invoiceNumber}</strong> totalling <strong>${data.currency} ${data.amount}</strong>, which was due on <strong>${data.dueDate}</strong>. Please make payment as soon as possible.</p>${payButton(data.payLink)}<p>${senderName(data)}</p>${pixel}`,
    },
    FINAL_NOTICE: {
      subject: `Final notice: Invoice ${data.invoiceNumber}`,
      html: `<p>Hi ${data.clientName},</p><p>This is a final notice regarding invoice <strong>${data.invoiceNumber}</strong> for <strong>${data.currency} ${data.amount}</strong>. This invoice is now significantly overdue. Please contact us immediately to resolve this matter.</p>${payButton(data.payLink)}<p>${senderName(data)}</p>${pixel}`,
    },
  };

  return (
    templates[template] ??
    (templates["INVOICE_SENT"] as { subject: string; html: string })
  );
};

export const getFollowUpWhatsAppTemplate = (
  template: string,
  data: TemplateData,
): string => {
  const link = data.payLink ? `\n\nPay here: ${data.payLink}` : "";

  const templates: Record<string, string> = {
    INVOICE_SENT: `Hi ${data.clientName}, this is ${senderName(data)}. Your invoice ${data.invoiceNumber} for ${data.currency} ${data.amount} is due on ${data.dueDate}.${link}`,
    PRE_DUE_REMINDER: `Hi ${data.clientName}, a reminder that invoice ${data.invoiceNumber} for ${data.currency} ${data.amount} is due on ${data.dueDate}.${link}`,
    FIRST_OVERDUE: `Hi ${data.clientName}, invoice ${data.invoiceNumber} for ${data.currency} ${data.amount} was due on ${data.dueDate} and is now overdue. Please arrange payment.${link}`,
    SECOND_OVERDUE: `Hi ${data.clientName}, we have not received payment for invoice ${data.invoiceNumber} (${data.currency} ${data.amount}), due ${data.dueDate}. Please pay as soon as possible.${link}`,
    FINAL_NOTICE: `Hi ${data.clientName}, final notice for invoice ${data.invoiceNumber} totalling ${data.currency} ${data.amount}. Please contact us immediately.${link}`,
  };

  return templates[template] ?? (templates["INVOICE_SENT"] as string);
};
