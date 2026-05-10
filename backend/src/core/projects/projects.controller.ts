import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "./projects.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const project = await createProject(req.userId!, req.body);
    sendSuccess(res, 201, "Project created", project);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query["status"] as string | undefined;
    const projects = await getProjects(req.userId!, status);
    sendSuccess(res, 200, "Projects fetched", projects);
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
    const project = await getProjectById(req.userId!, id);
    if (!project) {
      sendError(res, 404, "Project not found");
      return;
    }
    sendSuccess(res, 200, "Project fetched", project);
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
    const project = await updateProject(req.userId!, id, req.body);
    sendSuccess(res, 200, "Project updated", project);
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
    await deleteProject(req.userId!, id);
    sendSuccess(res, 200, "Project deleted");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
