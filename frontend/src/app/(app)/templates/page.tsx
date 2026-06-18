"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  InvoiceTemplate,
  CreateTemplateInput,
  TemplateItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { IconEdit, IconTrash } from "@/components/ui/icons";
import {
  LineItemsEditor,
  LineItem,
} from "@/components/invoices/line-items-editor";
import { useToast } from "@/components/ui/toast";
import { formatNaira } from "@/utils/format";

interface TemplateFormState {
  name: string;
  title: string;
  items: LineItem[];
  tax: string;
  notes: string;
  currency: string;
}

const emptyForm: TemplateFormState = {
  name: "",
  title: "",
  items: [{ description: "", quantity: "1", unitPrice: "" }],
  tax: "0",
  notes: "",
  currency: "NGN",
};

function templateToForm(template: InvoiceTemplate): TemplateFormState {
  return {
    name: template.name,
    title: template.title,
    items: (template.items as TemplateItem[]).map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),
    tax: String(Number(template.tax)),
    notes: template.notes ?? "",
    currency: template.currency,
  };
}

function computeSubtotal(items: LineItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: InvoiceTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const items = template.items as TemplateItem[];
  const taxNum = Number(template.tax);
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = subtotal + (subtotal * taxNum) / 100;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-neutral-900 truncate">
            {template.name}
          </p>
          <p className="text-sm text-neutral-500 truncate mt-0.5">
            {template.title}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Edit template"
          >
            <IconEdit />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
            aria-label="Delete template"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 truncate pr-4">
              {item.description || "Untitled item"}
            </span>
            <span className="text-neutral-900 font-medium tabular-nums flex-shrink-0">
              {formatNaira(item.quantity * item.unitPrice)}
            </span>
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-xs text-neutral-400">
            +{items.length - 3} more item{items.length - 3 !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
        <div className="text-xs text-neutral-400">
          {items.length} item{items.length !== 1 ? "s" : ""}
          {taxNum > 0 ? ` · ${taxNum}% tax` : ""}
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-neutral-900 tabular-nums">
            {formatNaira(total)}
          </p>
          {taxNum > 0 && (
            <p className="text-xs text-neutral-400">
              {formatNaira(subtotal)} + tax
            </p>
          )}
        </div>
      </div>

      <Link href={`/invoices/create?templateId=${template.id}`}>
        <Button variant="secondary" size="sm" className="w-full">
          Use Template
        </Button>
      </Link>
    </div>
  );
}

function TemplateFormModal({
  open,
  onClose,
  editTarget,
}: {
  open: boolean;
  onClose: () => void;
  editTarget: InvoiceTemplate | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const isEdit = editTarget !== null;

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setForm(templateToForm(editTarget));
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, editTarget]);

  const subtotal = useMemo(() => computeSubtotal(form.items), [form.items]);
  const taxPercent = parseFloat(form.tax) || 0;
  const taxAmount = (subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) => api.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast("Template created", "success");
      onClose();
    },
    onError: () => toast("Failed to create template", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      api.updateTemplate(editTarget!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast("Template updated", "success");
      onClose();
    },
    onError: () => toast("Failed to update template", "error"),
  });

  const validate = (): boolean => {
    const next: Partial<Record<string, string>> = {};
    if (!form.name.trim()) next["name"] = "Template name is required";
    if (!form.title.trim()) next["title"] = "Invoice title is required";
    if (form.items.some((i) => !i.description.trim() || !i.unitPrice))
      next["items"] = "All items must have a description and price";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): CreateTemplateInput => ({
    name: form.name.trim(),
    title: form.title.trim(),
    items: form.items.map((i) => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
    })),
    tax: taxPercent > 0 ? taxPercent : 0,
    notes: form.notes.trim() || undefined,
    currency: form.currency || "NGN",
  });

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = buildPayload();
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const update =
    (key: keyof TemplateFormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={isEdit ? "Edit Template" : "New Template"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSaving}>
            {isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Template Name"
          value={form.name}
          onChange={update("name")}
          placeholder="e.g. Monthly Retainer"
          error={errors["name"]}
        />
        <Input
          label="Invoice Title"
          value={form.title}
          onChange={update("title")}
          placeholder="e.g. Website Maintenance"
          error={errors["title"]}
        />
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-neutral-700">Line Items</p>
          <LineItemsEditor
            items={form.items}
            onChange={(items) => setForm((prev) => ({ ...prev, items }))}
            error={errors["items"]}
          />
        </div>
        <Input
          label="Tax (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={form.tax}
          onChange={update("tax")}
          suffix="%"
        />
        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={update("notes")}
          placeholder="Payment terms, bank details, or any other notes..."
        />
        {subtotal > 0 && (
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatNaira(subtotal)}</span>
            </div>
            {taxPercent > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Tax ({taxPercent}%)</span>
                <span className="tabular-nums">{formatNaira(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-200 pt-1.5 mt-0.5">
              <span>Total</span>
              <span className="tabular-nums">{formatNaira(total)}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvoiceTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<InvoiceTemplate[]>({
    queryKey: ["templates"],
    queryFn: () => api.listTemplates(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast("Template deleted", "success");
      setDeleteId(null);
    },
    onError: () => toast("Failed to delete template", "error"),
  });

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (template: InvoiceTemplate) => {
    setEditTarget(template);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-neutral-900 tracking-tight"
            style={{ letterSpacing: "-0.5px" }}
          >
            Templates
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {isLoading
              ? "Loading..."
              : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={openCreate}>New Template</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200">
          <EmptyState
            title="No templates yet"
            description="Create a template to reuse invoice details across multiple clients. You can also save any existing invoice as a template."
            action={<Button onClick={openCreate}>Create Template</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => openEdit(template)}
              onDelete={() => setDeleteId(template.id)}
            />
          ))}
        </div>
      )}

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editTarget={editTarget}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Template"
        message="This template will be permanently deleted. Invoices created from it will not be affected."
        confirmLabel="Delete Template"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
