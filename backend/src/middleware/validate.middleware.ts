import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { sendError } from "../utils/response.utils";

export const validate =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      sendError(res, 400, "Validation error", errors);
      return;
    }

    req.body = result.data;
    next();
  };
