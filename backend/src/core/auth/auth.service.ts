import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import prisma from "../../config/db.config";
import { ENV } from "../../constants/env";
import { RegisterInput, LoginInput, UpdateProfileInput } from "./auth.schema";

const generateAccessToken = (userId: string): string =>
  jwt.sign({ userId }, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as StringValue,
  });

const generateAndStoreRefreshToken = async (
  userId: string,
): Promise<string> => {
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

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      businessName: input.businessName ?? null,
      phone: input.phone ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      phone: true,
      createdAt: true,
    },
  });
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
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      phone: true,
      logoUrl: true,
      createdAt: true,
    },
  });

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.businessName !== undefined && {
        businessName: input.businessName ?? null,
      }),
      ...(input.phone !== undefined && { phone: input.phone ?? null }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl ?? null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      phone: true,
      logoUrl: true,
      updatedAt: true,
    },
  });
};
