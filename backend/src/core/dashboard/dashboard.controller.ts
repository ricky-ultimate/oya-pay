import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getDashboardStats } from "./dashboard.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const stats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getDashboardStats(req.userId!);
    sendSuccess(res, 200, "Dashboard stats fetched", data);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};
