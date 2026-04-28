import prisma from "../../config/db.config";
import { CreateClientInput, UpdateClientInput } from "./clients.schema";

export const createClient = async (userId: string, input: CreateClientInput) =>
  prisma.client.create({
    data: {
      userId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      address: input.address ?? null,
    },
  });

export const getClients = async (userId: string) =>
  prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });

export const getClientById = async (userId: string, clientId: string) =>
  prisma.client.findFirst({
    where: { id: clientId, userId },
    include: {
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

export const updateClient = async (
  userId: string,
  clientId: string,
  input: UpdateClientInput,
) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone ?? null }),
      ...(input.address !== undefined && { address: input.address ?? null }),
    },
  });
};

export const deleteClient = async (userId: string, clientId: string) => {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.client.delete({ where: { id: clientId } });
};
