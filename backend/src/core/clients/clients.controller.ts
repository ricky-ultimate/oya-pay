import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "./clients.service";
import { sendSuccess, sendError } from "../../utils/response.utils";

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const client = await createClient(req.userId!, req.body);
    sendSuccess(res, 201, "Client created", client);
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await getClients(req.userId!);
    sendSuccess(res, 200, "Clients fetched", clients);
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
    const client = await getClientById(req.userId!, id);
    if (!client) {
      sendError(res, 404, "Client not found");
      return;
    }
    sendSuccess(res, 200, "Client fetched", client);
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
    const client = await updateClient(req.userId!, id, req.body);
    sendSuccess(res, 200, "Client updated", client);
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
    await deleteClient(req.userId!, id);
    sendSuccess(res, 200, "Client deleted");
  } catch (error: unknown) {
    sendError(res, 400, (error as Error).message);
  }
};
