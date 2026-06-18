import { Response, Request } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { sendSuccess, sendError } from "../../utils/response.utils";
import prisma from "../../config/db.config";
import {
  verifySubaccountCode,
  createSubaccount,
  listBanks,
  resolveAccountNumber,
  getPaymentVerificationDetail,
} from "../../services/paystack.service";
import logger from "../../utils/logger.utils";
import { z } from "zod";

export const getBanks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const banks = await listBanks();
    sendSuccess(res, 200, "Banks fetched", banks);
  } catch (error) {
    logger("Get banks error:", error);
    sendError(res, 500, "Failed to fetch banks");
  }
};

export const resolveAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { account_number, bank_code } = req.query as {
      account_number?: string;
      bank_code?: string;
    };

    if (!account_number || !bank_code) {
      sendError(res, 400, "account_number and bank_code are required");
      return;
    }

    const result = await resolveAccountNumber(account_number, bank_code);
    sendSuccess(res, 200, "Account resolved", result);
  } catch (error) {
    logger("Resolve account error:", error);
    sendError(
      res,
      422,
      "Could not resolve account. Check the details and try again.",
    );
  }
};

const createSubaccountSchema = z.object({
  businessName: z.string().min(2),
  settlementBank: z.string().min(1),
  accountNumber: z.string().min(10).max(10),
  description: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactName: z.string().optional(),
  primaryContactPhone: z.string().optional(),
});

export const createSubaccountHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createSubaccountSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "Validation error", parsed.error.issues);
      return;
    }

    const result = await createSubaccount({
      businessName: parsed.data.businessName,
      settlementBank: parsed.data.settlementBank,
      accountNumber: parsed.data.accountNumber,
      percentageCharge: 0,
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description,
      }),
      ...(parsed.data.primaryContactEmail !== undefined && {
        primaryContactEmail: parsed.data.primaryContactEmail,
      }),
      ...(parsed.data.primaryContactName !== undefined && {
        primaryContactName: parsed.data.primaryContactName,
      }),
      ...(parsed.data.primaryContactPhone !== undefined && {
        primaryContactPhone: parsed.data.primaryContactPhone,
      }),
    });

    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        paystackSubaccountCode: result.subaccountCode,
        paystackSubaccountActive: true,
      },
    });

    sendSuccess(res, 201, "Subaccount created", result);
  } catch (error) {
    logger("Create subaccount error:", error);
    sendError(
      res,
      500,
      "Failed to create subaccount. Verify your bank details are correct.",
    );
  }
};

export const verifySubaccount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { code } = req.params as { code: string };
    const valid = await verifySubaccountCode(code);

    if (!valid) {
      sendError(res, 404, "Subaccount not found");
      return;
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        paystackSubaccountCode: code,
        paystackSubaccountActive: true,
      },
    });

    sendSuccess(res, 200, "Subaccount verified and saved");
  } catch (error) {
    logger("Verify subaccount error:", error);
    sendError(res, 500, "Failed to verify subaccount");
  }
};

export const verifyPaymentByReference = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { reference } = req.params as { reference: string };

    if (!reference || reference.trim().length === 0) {
      sendError(res, 400, "Payment reference is required");
      return;
    }

    const detail = await getPaymentVerificationDetail(reference);

    if (!detail) {
      sendError(res, 404, "Payment not found");
      return;
    }

    const invoiceId = detail.metadata["invoiceId"] as string | undefined;
    let invoiceData: {
      invoiceNumber: string;
      title: string;
      clientName: string;
      freelancerName: string;
      businessName: string | null;
      dueDate: string;
    } | null = null;

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: { select: { name: true } },
          user: { select: { name: true, businessName: true } },
        },
      });

      if (invoice) {
        invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          clientName: invoice.client.name,
          freelancerName: invoice.user.name,
          businessName: invoice.user.businessName,
          dueDate: invoice.dueDate.toISOString(),
        };
      }
    }

    sendSuccess(res, 200, "Payment verified", {
      status: detail.status,
      amount: detail.amount,
      currency: detail.currency,
      reference: detail.reference,
      gatewayResponse: detail.gatewayResponse,
      paidAt: detail.paidAt,
      customer: detail.customer,
      invoice: invoiceData,
    });
  } catch (error) {
    logger("Verify payment by reference error:", error);
    sendError(res, 500, "Failed to verify payment");
  }
};
