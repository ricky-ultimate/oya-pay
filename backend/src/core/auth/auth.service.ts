import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import prisma from "../../config/db.config";
import { ENV } from "../../constants/env";
import { RegisterInput, LoginInput, UpdateProfileInput } from "./auth.schema";
import { verifySubaccountCode } from "../../services/paystack.service";

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
} as const;

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

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      businessName: input.businessName ?? null,
      phone: input.phone,
    },
    select: { id: true, name: true, email: true, businessName: true },
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateAndStoreRefreshToken(user.id);

  return { accessToken, refreshToken, user };
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
    },
    select: USER_SELECT,
  });
};
