import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  getMe,
  updateProfile,
} from "./auth.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    sendSuccess(res, 201, "Account created successfully", result);
  } catch (error: unknown) {
    const message = (error as Error).message;
    const status = message === "Email already registered" ? 409 : 500;
    sendError(res, status, message);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    sendSuccess(res, 200, "Login successful", result);
  } catch (error: unknown) {
    sendError(res, 401, (error as Error).message);
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      sendError(res, 400, "Refresh token required");
      return;
    }
    const result = await refreshTokens(refreshToken);
    sendSuccess(res, 200, "Tokens refreshed", result);
  } catch (error: unknown) {
    sendError(res, 401, (error as Error).message);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) await logoutUser(refreshToken);
    sendSuccess(res, 200, "Logged out successfully");
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getMe(req.userId!);
    if (!user) {
      sendError(res, 404, "User not found");
      return;
    }
    sendSuccess(res, 200, "User fetched", user);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const patchProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await updateProfile(req.userId!, req.body);
    sendSuccess(res, 200, "Profile updated", user);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
