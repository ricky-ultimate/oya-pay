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
  if (!instanceId || !token) {
    logger("WhatsApp: no instance configured for this user");
    return false;
  }

  try {
    await axios.post(`${ULTRAMSG_BASE}/${instanceId}/messages/chat`, {
      token,
      to: formatPhone(phone),
      body: message,
    });
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

export const getInstanceStatus = async (
  instanceId: string,
  token: string,
): Promise<WhatsAppInstanceStatus> => {
  const response = await axios.get(
    `${ULTRAMSG_BASE}/${instanceId}/instance/status`,
    { params: { token } },
  );
  const data = response.data as {
    status?: string;
    qrCode?: string;
    phone?: { number?: string };
  };
  return {
    instanceId,
    status: data.status ?? "unknown",
    qrCode: data.qrCode ?? null,
    phoneConnected: data.phone?.number ?? null,
  };
};

export const getInstanceQr = async (
  instanceId: string,
  token: string,
): Promise<string | null> => {
  try {
    const response = await axios.get(
      `${ULTRAMSG_BASE}/${instanceId}/instance/qr`,
      { params: { token } },
    );
    const data = response.data as { qrCode?: string };
    return data.qrCode ?? null;
  } catch (error) {
    logger("WhatsApp QR fetch error:", error);
    return null;
  }
};

export const restartInstance = async (
  instanceId: string,
  token: string,
): Promise<boolean> => {
  try {
    await axios.get(`${ULTRAMSG_BASE}/${instanceId}/instance/restart`, {
      params: { token },
    });
    return true;
  } catch (error) {
    logger("WhatsApp restart error:", error);
    return false;
  }
};

export const logoutInstance = async (
  instanceId: string,
  token: string,
): Promise<boolean> => {
  try {
    await axios.get(`${ULTRAMSG_BASE}/${instanceId}/instance/logout`, {
      params: { token },
    });
    return true;
  } catch (error) {
    logger("WhatsApp logout error:", error);
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
