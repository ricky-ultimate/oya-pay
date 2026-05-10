"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Project,
  Invoice,
  InvoiceStatus,
  InvoiceType,
  ProjectStatus,
} from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatNaira, formatDate } from "@/utils/format";
import {
  INVOICE_TYPE_CONFIG,
  INVOICE_TYPE_ORDER,
  PROJECT_STATUS_CONFIG,
} from "@/utils/constants";

function InvoiceTypeBadge({ type }: { type: InvoiceType }) {
  const config = INVOICE_TYPE_CONFIG[type];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center h-4 px-1.5 rounded text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${accent ? "bg-success-50 border-success-200" : "bg-white border-neutral-200"}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-success-700" : "text-neutral-500"}`}
      >
        {label}
      </p>
      <p
        className={`text-xl font-bold tabular-nums tracking-tight ${accent ? "text-success-800" : "text-neutral-900"}`}
        style={{ letterSpacing: "-0.5px" }}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs ${accent ? "text-success-600" : "text-neutral-400"}`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("ACTIVE");

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateProject(id, {
        name: editName || undefined,
        paymentTermsDays: parseInt(editTerms, 10) || undefined,
        totalValue: editValue ? parseFloat(editValue) : undefined,
        status: editStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project updated", "success");
      setEditModal(false);
    },
    onError: (err: Error) =>
      toast(err.message ?? "Failed to update project", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project deleted", "success");
      router.push("/projects");
    },
    onError: (err: Error) =>
      toast(err.message ?? "Failed to delete project", "error"),
  });

  const openEditModal = () => {
    if (!project) return;
    setEditName(project.name);
    setEditTerms(String(project.paymentTermsDays));
    setEditValue(project.totalValue ? String(Number(project.totalValue)) : "");
    setEditStatus(project.status);
    setEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!project) return null;

  const invoices = (project.invoices ?? []) as Invoice[];
  const sortedInvoices = [...invoices].sort(
    (a, b) =>
      (INVOICE_TYPE_ORDER[a.invoiceType] ?? 3) -
        (INVOICE_TYPE_ORDER[b.invoiceType] ?? 3) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const totalForBar = project.totalValue
    ? Math.max(Number(project.totalValue), project.totalInvoiced ?? 0)
    : (project.totalInvoiced ?? 0);
  const collectedPct =
    totalForBar > 0
      ? Math.min(
          100,
          Math.round(((project.totalCollected ?? 0) / totalForBar) * 100),
        )
      : 0;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            {project.client.name} &middot; Net {project.paymentTermsDays}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={openEditModal}>
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryTile
          label="Invoiced"
          value={formatNaira(project.totalInvoiced ?? 0)}
          sub={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        />
        <SummaryTile
          label="Collected"
          value={formatNaira(project.totalCollected ?? 0)}
          sub={`${collectedPct}% of invoiced`}
          accent={(project.totalCollected ?? 0) > 0}
        />
        <SummaryTile
          label="Outstanding"
          value={formatNaira(project.outstanding ?? 0)}
          sub={
            project.totalValue
              ? `Contract: ${formatNaira(Number(project.totalValue))}`
              : undefined
          }
        />
      </div>

      {totalForBar > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Collection Progress
            </p>
            <p className="text-xs font-bold text-neutral-900 tabular-nums">
              {collectedPct}%
            </p>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-500"
              style={{ width: `${collectedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-neutral-400">
              {formatNaira(project.totalCollected ?? 0)} collected
            </p>
            <p className="text-xs text-neutral-400">
              {formatNaira(totalForBar)} target
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">Invoices</h2>
          <Link
            href={`/invoices/create?projectId=${project.id}&clientId=${project.clientId}`}
          >
            <Button size="sm">Add invoice</Button>
          </Link>
        </div>

        {sortedInvoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-neutral-500 mb-3">
              No invoices in this project yet.
            </p>
            <Link
              href={`/invoices/create?projectId=${project.id}&clientId=${project.clientId}`}
            >
              <Button size="sm">Add first invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {sortedInvoices.map((invoice) => {
              const paid = (invoice.payments ?? []).reduce(
                (s, p) => s + Number(p.amount),
                0,
              );
              const outstanding = Math.max(0, Number(invoice.total) - paid);
              const hasPendingFollowUps =
                (invoice.followUpSchedules ?? []).filter(
                  (s) => s.status === "PENDING",
                ).length > 0;

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusBadge status={invoice.status as InvoiceStatus} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {invoice.title}
                        </p>
                        <InvoiceTypeBadge type={invoice.invoiceType} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-neutral-500">
                          {invoice.invoiceNumber}
                        </p>
                        {hasPendingFollowUps && (
                          <span className="hidden sm:inline-flex items-center h-4 px-1.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-semibold border border-primary-100">
                            reminders active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold tabular-nums text-neutral-900">
                      {formatNaira(Number(invoice.total))}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {outstanding > 0
                        ? `${formatNaira(outstanding)} due`
                        : formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={() => setDeleteModal(true)}
          className="text-error-600 hover:bg-error-50"
          size="md"
        >
          Delete project
        </Button>
      </div>

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Project"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModal(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Payment Terms (days)"
            type="number"
            min="1"
            max="365"
            value={editTerms}
            onChange={(e) => setEditTerms(e.target.value)}
            suffix="days"
          />
          <Input
            label="Estimated Value (optional)"
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            prefix="₦"
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Project"
        message="This project will be permanently deleted. Invoices linked to it will remain but will become standalone. This action cannot be undone."
        confirmLabel="Delete Project"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
