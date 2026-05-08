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

export interface CreateSubaccountOptions {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge: number;
  description?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
}

export interface SubaccountResult {
  subaccountCode: string;
  businessName: string;
  settlementBank: string;
  accountNumber: string;
}

export const createSubaccount = async (
  options: CreateSubaccountOptions,
): Promise<SubaccountResult> => {
  const response = await paystackClient.post("/subaccount", {
    business_name: options.businessName,
    settlement_bank: options.settlementBank,
    account_number: options.accountNumber,
    percentage_charge: options.percentageCharge,
    description: options.description,
    primary_contact_email: options.primaryContactEmail,
    primary_contact_name: options.primaryContactName,
    primary_contact_phone: options.primaryContactPhone,
  });

  return {
    subaccountCode: response.data.data.subaccount_code as string,
    businessName: response.data.data.business_name as string,
    settlementBank: response.data.data.settlement_bank as string,
    accountNumber: response.data.data.account_number as string,
  };
};

export const listBanks = async (): Promise<
  Array<{ name: string; code: string }>
> => {
  const response = await paystackClient.get(
    "/bank?country=nigeria&perPage=100",
  );
  return (response.data.data as Array<{ name: string; code: string }>).map(
    (b) => ({ name: b.name, code: b.code }),
  );
};

export const resolveAccountNumber = async (
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string }> => {
  const response = await paystackClient.get(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
  );
  return {
    accountName: response.data.data.account_name as string,
    accountNumber: response.data.data.account_number as string,
  };
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
