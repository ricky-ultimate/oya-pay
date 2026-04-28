import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  logPayment,
  getPaymentsByInvoice,
  deletePayment,
} from "./payments.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const log = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await logPayment(req.userId!, req.body);
    sendSuccess(res, 201, "Payment logged", payment);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const listByInvoice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const invoiceId = req.params["invoiceId"] as string;
    const payments = await getPaymentsByInvoice(req.userId!, invoiceId);
    sendSuccess(res, 200, "Payments fetched", payments);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    await deletePayment(req.userId!, id);
    sendSuccess(res, 200, "Payment deleted");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
