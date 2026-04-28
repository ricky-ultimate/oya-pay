import axios from "axios";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

const buildBaseUrl = () =>
  `https://api.ultramsg.com/${ENV.ULTRAMSG_INSTANCE_ID}`;

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
  try {
    await axios.post(`${buildBaseUrl()}/messages/chat`, {
      token: ENV.ULTRAMSG_TOKEN,
      to: formatPhone(phone),
      body: message,
    });
    return true;
  } catch (error) {
    logger("WhatsApp send error:", error);
    return false;
  }
};
