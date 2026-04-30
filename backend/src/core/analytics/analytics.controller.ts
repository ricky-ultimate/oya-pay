import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getFollowUpAnalytics } from "../../services/analytics.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const followUpAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await getFollowUpAnalytics(req.userId!);
    sendSuccess(res, 200, "Analytics fetched", data);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};
