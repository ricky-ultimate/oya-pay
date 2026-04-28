import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.utils";
import { sendError } from "../utils/response.utils";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger("Unhandled error:", err.message, err.stack);
  sendError(res, 500, "Internal server error");
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};
