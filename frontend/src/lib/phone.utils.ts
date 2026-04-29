export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, "");
}

export type PhoneWarningLevel = "none" | "caution" | "invalid";

export interface PhoneValidationResult {
  level: PhoneWarningLevel;
  message: string | null;
}

export function validatePhoneForWhatsApp(phone: string): PhoneValidationResult {
  if (!phone.trim()) return { level: "none", message: null };

  const cleaned = normalizePhone(phone);

  if (/^0[789]\d{9}$/.test(cleaned) || /^234[789]\d{9}$/.test(cleaned)) {
    return { level: "none", message: null };
  }

  if (/^\d{7,15}$/.test(cleaned)) {
    return {
      level: "caution",
      message:
        "Non-Nigerian format — WhatsApp delivery may be unreliable. Expected: 0801XXXXXXX or 2348XXXXXXXXX",
    };
  }

  return {
    level: "invalid",
    message: "This does not look like a valid phone number.",
  };
}

export function isWhatsAppCapable(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = normalizePhone(phone);
  return /^0[789]\d{9}$/.test(cleaned) || /^234[789]\d{9}$/.test(cleaned);
}
