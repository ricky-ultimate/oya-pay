import { z } from "zod";

export const createProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  totalValue: z.number().positive().optional(),
  paymentTermsDays: z.number().int().min(1).max(365).default(14),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  totalValue: z.number().positive().optional(),
  paymentTermsDays: z.number().int().min(1).max(365).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
