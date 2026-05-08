import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response.utils";
import prisma from "../../config/db.config";
import {
  createUserInstance,
  getInstanceStatus,
  getInstanceQr,
  restartInstance,
  logoutInstance,
} from "../../services/whatsapp.service";
import logger from "../../utils/logger.utils";

export const getWhatsAppStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      sendError(res, 404, "User not found");
      return;
    }

    if (!user.ultramsgInstanceId || !user.ultramsgToken) {
      sendSuccess(res, 200, "WhatsApp status fetched", {
        connected: false,
        status: "not_configured",
        qrCode: null,
        phoneConnected: null,
        instanceId: null,
      });
      return;
    }

    const status = await getInstanceStatus(
      user.ultramsgInstanceId,
      user.ultramsgToken,
    );

    sendSuccess(res, 200, "WhatsApp status fetched", {
      connected: status.status === "authenticated",
      status: status.status,
      qrCode: status.qrCode,
      phoneConnected: status.phoneConnected,
      instanceId: status.instanceId,
    });
  } catch (error) {
    logger("WhatsApp status error:", error);
    sendError(res, 500, "Failed to fetch WhatsApp status");
  }
};

export const getWhatsAppQr = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || !user.ultramsgInstanceId || !user.ultramsgToken) {
      sendError(res, 404, "WhatsApp instance not configured");
      return;
    }

    const qrCode = await getInstanceQr(
      user.ultramsgInstanceId,
      user.ultramsgToken,
    );
    sendSuccess(res, 200, "QR code fetched", { qrCode });
  } catch (error) {
    logger("QR fetch error:", error);
    sendError(res, 500, "Failed to fetch QR code");
  }
};

export const provisionInstance = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      sendError(res, 404, "User not found");
      return;
    }

    if (user.ultramsgInstanceId && user.ultramsgToken) {
      const status = await getInstanceStatus(
        user.ultramsgInstanceId,
        user.ultramsgToken,
      );
      sendSuccess(res, 200, "Instance already provisioned", {
        instanceId: user.ultramsgInstanceId,
        status: status.status,
        qrCode: status.qrCode,
      });
      return;
    }

    const phone = (req.body as { phone?: string }).phone ?? user.phone ?? "";
    const instance = await createUserInstance(user.id, phone);

    if (!instance) {
      sendError(res, 503, "WhatsApp provisioning is not available");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ultramsgInstanceId: instance.instanceId,
        ultramsgToken: instance.token,
      },
    });

    const status = await getInstanceStatus(instance.instanceId, instance.token);

    sendSuccess(res, 201, "Instance provisioned", {
      instanceId: instance.instanceId,
      status: status.status,
      qrCode: status.qrCode,
    });
  } catch (error) {
    logger("WhatsApp provision error:", error);
    sendError(res, 500, "Failed to provision WhatsApp instance");
  }
};

export const restartWhatsApp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || !user.ultramsgInstanceId || !user.ultramsgToken) {
      sendError(res, 404, "WhatsApp instance not configured");
      return;
    }

    const ok = await restartInstance(
      user.ultramsgInstanceId,
      user.ultramsgToken,
    );
    if (!ok) {
      sendError(res, 500, "Failed to restart instance");
      return;
    }

    sendSuccess(res, 200, "Instance restarted");
  } catch (error) {
    logger("WhatsApp restart error:", error);
    sendError(res, 500, "Failed to restart instance");
  }
};

export const logoutWhatsApp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || !user.ultramsgInstanceId || !user.ultramsgToken) {
      sendError(res, 404, "WhatsApp instance not configured");
      return;
    }

    const ok = await logoutInstance(
      user.ultramsgInstanceId,
      user.ultramsgToken,
    );
    if (!ok) {
      sendError(res, 500, "Failed to logout instance");
      return;
    }

    sendSuccess(res, 200, "WhatsApp logged out. Scan QR to reconnect.");
  } catch (error) {
    logger("WhatsApp logout error:", error);
    sendError(res, 500, "Failed to logout");
  }
};

export const disconnectWhatsApp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ultramsgInstanceId: null,
        ultramsgToken: null,
      },
    });
    sendSuccess(res, 200, "WhatsApp disconnected");
  } catch (error) {
    logger("WhatsApp disconnect error:", error);
    sendError(res, 500, "Failed to disconnect");
  }
};
