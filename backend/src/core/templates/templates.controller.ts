import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./templates.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await listTemplates(req.userId!);
    sendSuccess(res, 200, "Templates fetched", templates);
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
    const template = await getTemplateById(req.userId!, id);
    if (!template) {
      sendError(res, 404, "Template not found");
      return;
    }
    sendSuccess(res, 200, "Template fetched", template);
  } catch (error: unknown) {
    sendError(res, 500, (error as Error).message);
  }
};

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const template = await createTemplate(req.userId!, req.body);
    sendSuccess(res, 201, "Template created", template);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    const template = await updateTemplate(req.userId!, id, req.body);
    sendSuccess(res, 200, "Template updated", template);
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
    await deleteTemplate(req.userId!, id);
    sendSuccess(res, 200, "Template deleted");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
