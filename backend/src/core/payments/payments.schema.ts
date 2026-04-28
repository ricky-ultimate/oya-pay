import { z } from "zod";

export const logPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export type LogPaymentInput = z.infer<typeof logPaymentSchema>;
