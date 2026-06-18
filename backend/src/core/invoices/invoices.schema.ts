import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const followUpStepSchema = z.object({
  template: z.enum([
    "PRE_DUE_REMINDER",
    "FIRST_OVERDUE",
    "SECOND_OVERDUE",
    "FINAL_NOTICE",
  ]),
  offsetDays: z.number().int().min(-30).max(60),
  channels: z.array(z.enum(["EMAIL", "WHATSAPP"])).min(1),
  enabled: z.boolean(),
});

export const createInvoiceSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().min(1),
  invoiceType: z
    .enum(["STANDARD", "DEPOSIT", "MILESTONE", "FINAL"])
    .default("STANDARD"),
  dueDate: z.string().datetime(),
  currency: z.string().default("NGN"),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceSchema = createInvoiceSchema
  .omit({ items: true })
  .partial()
  .extend({
    items: z.array(invoiceItemSchema).min(1).optional(),
  });

export const sendInvoiceSchema = z.object({
  channels: z
    .array(z.enum(["EMAIL", "WHATSAPP"]))
    .min(1)
    .default(["EMAIL"]),
  followUpConfig: z.array(followUpStepSchema).optional(),
});

export const previewFollowUpSchema = z.object({
  template: z.enum([
    "INVOICE_SENT",
    "PRE_DUE_REMINDER",
    "FIRST_OVERDUE",
    "SECOND_OVERDUE",
    "FINAL_NOTICE",
  ]),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
});

export const triggerFollowUpSchema = z.object({
  note: z.string().max(500).optional(),
});

export const escalateFollowUpSchema = z.object({
  template: z.enum([
    "INVOICE_SENT",
    "PRE_DUE_REMINDER",
    "FIRST_OVERDUE",
    "SECOND_OVERDUE",
    "FINAL_NOTICE",
  ]),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  note: z.string().max(500).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
export type PreviewFollowUpInput = z.infer<typeof previewFollowUpSchema>;
export type TriggerFollowUpInput = z.infer<typeof triggerFollowUpSchema>;
export type EscalateFollowUpInput = z.infer<typeof escalateFollowUpSchema>;
export type FollowUpStepInput = z.infer<typeof followUpStepSchema>;
