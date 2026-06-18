import prisma from "../../config/db.config";
import { CreateTemplateInput, UpdateTemplateInput } from "./templates.schema";

export interface TemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export const listTemplates = async (userId: string) => {
  return prisma.invoiceTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getTemplateById = async (userId: string, templateId: string) => {
  return prisma.invoiceTemplate.findFirst({
    where: { id: templateId, userId },
  });
};

export const createTemplate = async (
  userId: string,
  input: CreateTemplateInput,
) => {
  return prisma.invoiceTemplate.create({
    data: {
      userId,
      name: input.name,
      title: input.title,
      items: input.items,
      tax: input.tax,
      notes: input.notes ?? null,
      currency: input.currency,
    },
  });
};

export const updateTemplate = async (
  userId: string,
  templateId: string,
  input: UpdateTemplateInput,
) => {
  const template = await prisma.invoiceTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!template) throw new Error("Template not found");

  return prisma.invoiceTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.items !== undefined && { items: input.items }),
      ...(input.tax !== undefined && { tax: input.tax }),
      ...(input.notes !== undefined && { notes: input.notes ?? null }),
      ...(input.currency !== undefined && { currency: input.currency }),
    },
  });
};

export const deleteTemplate = async (userId: string, templateId: string) => {
  const template = await prisma.invoiceTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!template) throw new Error("Template not found");

  return prisma.invoiceTemplate.delete({ where: { id: templateId } });
};
