import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../constants/env";
import { sendError } from "../utils/response.utils";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "Unauthorized");
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    sendError(res, 401, "Unauthorized");
    return;
  }

  try {
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as {
      userId: string;
    };
    req.userId = payload.userId;
    next();
  } catch {
    sendError(res, 401, "Invalid or expired token");
  }
};
