import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/response.utils";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      sendError(
        res,
        400,
        "Validation error",
        result.error.flatten().fieldErrors,
      );
      return;
    }

    req.body = result.data;
    next();
  };
