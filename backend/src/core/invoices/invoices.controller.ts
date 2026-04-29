import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  getInvoicePDF,
  updateInvoiceStatus,
  getOrRegeneratePaymentLink,
  getFollowUpActivity,
  cancelFollowUp,
} from "./invoices.service";
import {
  previewFollowUpMessage,
  triggerScheduledFollowUp,
  escalateFollowUp,
  pauseFollowUpsForInvoice,
  resumeFollowUpsForInvoice,
} from "../../services/followup.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import {
  InvoiceStatus,
  FollowUpTemplate,
  FollowUpChannel,
} from "../../generated/prisma/client";
import {
  PreviewFollowUpInput,
  TriggerFollowUpInput,
  EscalateFollowUpInput,
} from "./invoices.schema";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const invoice = await createInvoice(req.userId!, req.body);
    sendSuccess(res, 201, "Invoice created", invoice);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query["status"] as string | undefined;
    const invoices = await getInvoices(req.userId!, status);
    sendSuccess(res, 200, "Invoices fetched", invoices);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const getOne = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const invoice = await getInvoiceById(req.userId!, id);
    if (!invoice) {
      sendError(res, 404, "Invoice not found");
      return;
    }
    sendSuccess(res, 200, "Invoice fetched", invoice);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const invoice = await updateInvoice(req.userId!, id, req.body);
    sendSuccess(res, 200, "Invoice updated", invoice);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    await deleteInvoice(req.userId!, id);
    sendSuccess(res, 200, "Invoice deleted");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const send = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const result = await sendInvoice(req.userId!, id, req.body);
    sendSuccess(res, 200, "Invoice sent", result);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const downloadPDF = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const pdf = await getInvoicePDF(req.userId!, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice.pdf"`);
    res.send(pdf);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const { status } = req.body as { status?: string };
    const validStatuses = Object.values(InvoiceStatus) as string[];
    if (!status || !validStatuses.includes(status)) {
      sendError(res, 400, "Invalid status");
      return;
    }
    const invoice = await updateInvoiceStatus(
      req.userId!,
      id,
      status as InvoiceStatus,
    );
    sendSuccess(res, 200, "Invoice status updated", invoice);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const paymentLink = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const forceRegenerate = req.query["regenerate"] === "true";
    const result = await getOrRegeneratePaymentLink(
      req.userId!,
      id,
      forceRegenerate,
    );
    sendSuccess(res, 200, "Payment link fetched", result);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const followUpActivity = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const data = await getFollowUpActivity(req.userId!, id);
    sendSuccess(res, 200, "Follow-up activity fetched", data);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const cancelFollowUpSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const scheduleId = req.params["scheduleId"] as string;
    await cancelFollowUp(req.userId!, scheduleId);
    sendSuccess(res, 200, "Follow-up cancelled");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const previewFollowUp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const { template, channel } = req.body as PreviewFollowUpInput;
    const preview = await previewFollowUpMessage(
      req.userId!,
      id,
      template as FollowUpTemplate,
    );
    sendSuccess(res, 200, "Preview generated", { ...preview, channel });
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const triggerFollowUp = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const scheduleId = req.params["scheduleId"] as string;
    const { note } = req.body as TriggerFollowUpInput;
    await triggerScheduledFollowUp(req.userId!, scheduleId, note);
    sendSuccess(res, 200, "Follow-up sent");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const escalateNow = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const { template, channel, note } = req.body as EscalateFollowUpInput;
    await escalateFollowUp(
      req.userId!,
      id,
      template as FollowUpTemplate,
      channel as FollowUpChannel,
      note,
    );
    sendSuccess(res, 200, "Follow-up sent");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const pauseFollowUps = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const count = await pauseFollowUpsForInvoice(req.userId!, id);
    sendSuccess(res, 200, "Follow-ups paused", { count });
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const resumeFollowUps = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const count = await resumeFollowUpsForInvoice(req.userId!, id);
    sendSuccess(res, 200, "Follow-ups resumed", { count });
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
