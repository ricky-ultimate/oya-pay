import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { getPlatformInstanceStatus } from "../../services/whatsapp.service";
import logger from "../../utils/logger.utils";

export const getPlatformWhatsAppStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const status = await getPlatformInstanceStatus();

    if (!status) {
      sendSuccess(res, 200, "WhatsApp status fetched", {
        configured: false,
        connected: false,
        status: "not_configured",
        phoneConnected: null,
      });
      return;
    }

    sendSuccess(res, 200, "WhatsApp status fetched", {
      configured: true,
      connected: status.status === "authenticated",
      status: status.status,
      phoneConnected: status.phoneConnected,
    });
  } catch (error) {
    logger("WhatsApp platform status error:", error);
    sendError(res, 500, "Failed to fetch WhatsApp status");
  }
};
