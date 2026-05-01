import axios from "axios";
import crypto from "crypto";
import { ENV } from "../constants/env";
import logger from "../utils/logger.utils";

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface InitializePaymentOptions {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  subaccountCode?: string | null;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export const initializePayment = async (
  options: InitializePaymentOptions,
): Promise<InitializePaymentResult | null> => {
  try {
    const body: Record<string, unknown> = {
      email: options.email,
      amount: Math.round(options.amount * 100),
      reference: options.reference,
      metadata: options.metadata,
      callback_url: options.callbackUrl,
    };

    if (options.subaccountCode) {
      body["split"] = {
        type: "percentage",
        subaccounts: [
          {
            subaccount: options.subaccountCode,
            share: 95,
          },
        ],
        bearer_type: "subaccount",
        bearer_subaccount: options.subaccountCode,
      };
    }

    const response = await paystackClient.post("/transaction/initialize", body);

    return {
      authorizationUrl: response.data.data.authorization_url as string,
      accessCode: response.data.data.access_code as string,
      reference: response.data.data.reference as string,
    };
  } catch (error) {
    logger("Paystack initialize error:", error);
    return null;
  }
};

export const verifyPayment = async (reference: string): Promise<boolean> => {
  try {
    const response = await paystackClient.get(
      `/transaction/verify/${reference}`,
    );
    return (response.data.data.status as string) === "success";
  } catch (error) {
    logger("Paystack verify error:", error);
    return false;
  }
};

export const verifySubaccountCode = async (
  subaccountCode: string,
): Promise<boolean> => {
  try {
    const response = await paystackClient.get(`/subaccount/${subaccountCode}`);
    return response.data.status === true;
  } catch {
    return false;
  }
};

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const hash = crypto
    .createHmac("sha512", ENV.PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");
  return hash === signature;
};
