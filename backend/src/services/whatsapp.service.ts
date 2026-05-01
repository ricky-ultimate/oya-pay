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
  instanceId?: string | null,
  token?: string | null,
): Promise<boolean> => {
  const activeInstanceId = instanceId ?? ENV.ULTRAMSG_INSTANCE_ID;
  const activeToken = token ?? ENV.ULTRAMSG_TOKEN;

  if (!activeInstanceId || !activeToken) {
    logger(
      "WhatsApp: no instance configured for this user and no global fallback",
    );
    return false;
  }

  try {
    await axios.post(`${ULTRAMSG_BASE}/${activeInstanceId}/messages/chat`, {
      token: activeToken,
      to: formatPhone(phone),
      body: message,
    });
    return true;
  } catch (error) {
    logger("WhatsApp send error:", error);
    return false;
  }
};

export const createUserInstance = async (
  userId: string,
  phone: string,
): Promise<{ instanceId: string; token: string } | null> => {
  if (!ENV.ULTRAMSG_MASTER_TOKEN) {
    return null;
  }

  try {
    const response = await axios.post(`${ULTRAMSG_BASE}/instance`, {
      token: ENV.ULTRAMSG_MASTER_TOKEN,
      phone: formatPhone(phone),
      name: `oyapay-${userId.substring(0, 8)}`,
    });

    const data = response.data as { instanceId: string; token: string };
    return { instanceId: data.instanceId, token: data.token };
  } catch (error) {
    logger("UltraMsg instance creation error:", error);
    return null;
  }
};
