import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().optional(),
  phone: z
    .string()
    .min(10, "A valid phone number is required for WhatsApp delivery"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional(),
  paystackSubaccountCode: z.string().optional(),
  paystackSubaccountActive: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only digits"),
});

export const resendCodeSchema = z.object({
  email: z.string().email(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
