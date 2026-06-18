import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { StringValue } from "ms";
import prisma from "../../config/db.config";
import { ENV } from "../../constants/env";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  VerifyEmailInput,
} from "./auth.schema";
import { verifySubaccountCode } from "../../services/paystack.service";
import { sendEmail } from "../../services/email.service";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  businessName: true,
  phone: true,
  logoUrl: true,
  createdAt: true,
  paystackSubaccountCode: true,
  paystackSubaccountActive: true,
  bankName: true,
  bankAccount: true,
  bankAccountName: true,
  invoiceTerms: true,
} as const;

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESEND_COUNT = 5;

const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateAccessToken = (userId: string): string => {
  if (!ENV.JWT_ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is not set");
  return jwt.sign({ userId }, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as StringValue,
  });
};

const generateAndStoreRefreshToken = async (
  userId: string,
): Promise<string> => {
  if (!ENV.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not set");
  const token = jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as StringValue,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });

  return token;
};

const sendVerificationEmail = async (
  to: string,
  name: string,
  code: string,
): Promise<void> => {
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Verify your email</p>
      <p style="font-size: 15px; color: #6B7280; margin: 0 0 32px;">Hi ${name}, enter this code to complete your OyaPay registration.</p>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #111827; margin: 0; font-variant-numeric: tabular-nums;">${code}</p>
      </div>
      <p style="font-size: 13px; color: #9CA3AF; margin: 0;">This code expires in 10 minutes. If you did not attempt to register, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: `${code} is your OyaPay verification code`,
    html,
  });
};

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error("Email already registered. Please log in instead.");
  }

  const hashed = await bcrypt.hash(input.password, 12);
  const code = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  await prisma.pendingUser.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      name: input.name,
      phone: input.phone,
      businessName: input.businessName ?? null,
      password: hashed,
      verificationCode: code,
      codeExpiresAt,
      resendCount: 0,
      lastResendAt: new Date(),
    },
    update: {
      name: input.name,
      phone: input.phone,
      businessName: input.businessName ?? null,
      password: hashed,
      verificationCode: code,
      codeExpiresAt,
      resendCount: 0,
      lastResendAt: new Date(),
    },
  });

  await sendVerificationEmail(input.email, input.name, code);

  return { requiresVerification: true, email: input.email };
};

export const verifyEmail = async (input: VerifyEmailInput) => {
  const pending = await prisma.pendingUser.findUnique({
    where: { email: input.email },
  });

  if (!pending) {
    throw new Error("No pending registration found for this email address.");
  }

  if (new Date() > pending.codeExpiresAt) {
    throw new Error("Verification code has expired. Please request a new one.");
  }

  if (pending.verificationCode !== input.code) {
    throw new Error("Invalid verification code.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: pending.email,
        name: pending.name,
        phone: pending.phone,
        businessName: pending.businessName ?? null,
        password: pending.password,
      },
      select: { id: true, name: true, email: true, businessName: true },
    });

    await tx.pendingUser.delete({ where: { id: pending.id } });

    return created;
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateAndStoreRefreshToken(user.id);

  return { accessToken, refreshToken, user };
};

export const resendVerificationCode = async (email: string) => {
  const pending = await prisma.pendingUser.findUnique({ where: { email } });

  if (!pending) {
    throw new Error("No pending registration found for this email address.");
  }

  if (pending.resendCount >= MAX_RESEND_COUNT) {
    throw new Error(
      "Maximum resend attempts reached. Please restart the registration process.",
    );
  }

  if (pending.resendCount > 0) {
    const elapsed = Date.now() - pending.lastResendAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new Error(
        `Please wait ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""} before requesting a new code.`,
      );
    }
  }

  const code = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  await prisma.pendingUser.update({
    where: { id: pending.id },
    data: {
      verificationCode: code,
      codeExpiresAt,
      resendCount: pending.resendCount + 1,
      lastResendAt: new Date(),
    },
  });

  await sendVerificationEmail(email, pending.name, code);

  return { sent: true };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateAndStoreRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
    },
  };
};

export const refreshTokens = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  try {
    jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Invalid refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = generateAccessToken(stored.userId);
  const newRefreshToken = await generateAndStoreRefreshToken(stored.userId);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getMe = async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
) => {
  if (input.paystackSubaccountCode) {
    const valid = await verifySubaccountCode(input.paystackSubaccountCode);
    if (!valid) throw new Error("Invalid Paystack subaccount code");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.businessName !== undefined && {
        businessName: input.businessName ?? null,
      }),
      ...(input.phone !== undefined && { phone: input.phone ?? undefined }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl ?? null }),
      ...(input.paystackSubaccountCode !== undefined && {
        paystackSubaccountCode: input.paystackSubaccountCode ?? null,
        paystackSubaccountActive: !!input.paystackSubaccountCode,
      }),
      ...(input.bankName !== undefined && { bankName: input.bankName ?? null }),
      ...(input.bankAccount !== undefined && {
        bankAccount: input.bankAccount ?? null,
      }),
      ...(input.bankAccountName !== undefined && {
        bankAccountName: input.bankAccountName ?? null,
      }),
      ...(input.invoiceTerms !== undefined && {
        invoiceTerms: input.invoiceTerms ?? null,
      }),
    },
    select: USER_SELECT,
  });
};

export const deleteExpiredPendingUsers = async (): Promise<number> => {
  const result = await prisma.pendingUser.deleteMany({
    where: { codeExpiresAt: { lt: new Date() } },
  });
  return result.count;
};
