import { Response } from "express";

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? null,
  });
};
