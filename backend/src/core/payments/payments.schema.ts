import { z } from "zod";

export const logPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export type LogPaymentInput = z.infer<typeof logPaymentSchema>;
