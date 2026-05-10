import prisma from "../../config/db.config";
import { CreateProjectInput, UpdateProjectInput } from "./projects.schema";
import { ProjectStatus } from "../../generated/prisma/client";

const PROJECT_CLIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const;

const computeSummary = (
  invoices: Array<{
    total: unknown;
    payments: Array<{ amount: unknown }>;
  }>,
) => {
  const totalInvoiced = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalCollected = invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ps, p) => ps + Number(p.amount), 0),
    0,
  );
  const outstanding = Math.max(0, totalInvoiced - totalCollected);
  return { totalInvoiced, totalCollected, outstanding };
};

export const createProject = async (
  userId: string,
  input: CreateProjectInput,
) => {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, userId },
  });
  if (!client) throw new Error("Client not found");

  return prisma.project.create({
    data: {
      userId,
      clientId: input.clientId,
      name: input.name,
      totalValue: input.totalValue ?? null,
      paymentTermsDays: input.paymentTermsDays,
    },
    include: { client: { select: PROJECT_CLIENT_SELECT } },
  });
};

export const getProjects = async (userId: string, status?: string) => {
  const projects = await prisma.project.findMany({
    where: {
      userId,
      ...(status ? { status: status as ProjectStatus } : {}),
    },
    include: {
      client: { select: PROJECT_CLIENT_SELECT },
      invoices: {
        include: { payments: { select: { amount: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((project) => {
    const { totalInvoiced, totalCollected, outstanding } = computeSummary(
      project.invoices,
    );
    const { invoices: _invoices, ...rest } = project;
    return {
      ...rest,
      invoiceCount: project.invoices.length,
      totalInvoiced,
      totalCollected,
      outstanding,
    };
  });
};

export const getProjectById = async (userId: string, projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      client: { select: PROJECT_CLIENT_SELECT },
      invoices: {
        include: {
          payments: { select: { amount: true } },
          followUpSchedules: {
            where: { status: { in: ["PENDING", "PAUSED"] } },
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) return null;

  const { totalInvoiced, totalCollected, outstanding } = computeSummary(
    project.invoices,
  );

  return { ...project, totalInvoiced, totalCollected, outstanding };
};

export const updateProject = async (
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.totalValue !== undefined && {
        totalValue: input.totalValue ?? null,
      }),
      ...(input.paymentTermsDays !== undefined && {
        paymentTermsDays: input.paymentTermsDays,
      }),
      ...(input.status !== undefined && {
        status: input.status as ProjectStatus,
      }),
    },
    include: { client: { select: PROJECT_CLIENT_SELECT } },
  });
};

export const deleteProject = async (userId: string, projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { _count: { select: { invoices: true } } },
  });
  if (!project) throw new Error("Project not found");
  if (project._count.invoices > 0) {
    throw new Error(
      "Cannot delete a project that has invoices. Cancel it instead.",
    );
  }
  return prisma.project.delete({ where: { id: projectId } });
};
