import { z } from "zod";

const templateItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1),
  items: z.array(templateItemSchema).min(1),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  currency: z.string().default("NGN"),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
