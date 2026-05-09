import axios from "axios";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

const ULTRAMSG_BASE = "https://api.ultramsg.com";

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return `234${cleaned.substring(1)}`;
  }
  return cleaned;
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<boolean> => {
  if (!ENV.ULTRAMSG_INSTANCE_ID || !ENV.ULTRAMSG_TOKEN) {
    logger("WhatsApp: platform instance not configured");
    return false;
  }

  try {
    await axios.post(
      `${ULTRAMSG_BASE}/${ENV.ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        token: ENV.ULTRAMSG_TOKEN,
        to: formatPhone(phone),
        body: message,
      },
    );
    return true;
  } catch (error) {
    logger("WhatsApp send error:", error);
    return false;
  }
};

export interface WhatsAppInstanceStatus {
  instanceId: string;
  status: string;
  qrCode: string | null;
  phoneConnected: string | null;
}

export const getPlatformInstanceStatus =
  async (): Promise<WhatsAppInstanceStatus | null> => {
    if (!ENV.ULTRAMSG_INSTANCE_ID || !ENV.ULTRAMSG_TOKEN) {
      return null;
    }

    try {
      const response = await axios.get(
        `${ULTRAMSG_BASE}/${ENV.ULTRAMSG_INSTANCE_ID}/instance/status`,
        { params: { token: ENV.ULTRAMSG_TOKEN } },
      );
      const data = response.data as {
        status?: string;
        qrCode?: string;
        phone?: { number?: string };
      };
      return {
        instanceId: ENV.ULTRAMSG_INSTANCE_ID,
        status: data.status ?? "unknown",
        qrCode: data.qrCode ?? null,
        phoneConnected: data.phone?.number ?? null,
      };
    } catch (error) {
      logger("WhatsApp status check error:", error);
      return null;
    }
  };
