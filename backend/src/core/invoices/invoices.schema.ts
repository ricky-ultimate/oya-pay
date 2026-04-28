import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

export const createInvoiceSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().cuid(),
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
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
