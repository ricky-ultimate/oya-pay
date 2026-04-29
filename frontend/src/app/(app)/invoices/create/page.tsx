"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  Client,
  CreateInvoiceInput,
  FollowUpStepConfig,
  buildDefaultFollowUpSteps,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FollowUpTimeline } from "@/components/invoices/follow-up-timeline";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function computeScheduledDate(dueDate: string, offsetDays: number): string {
  const due = new Date(dueDate);
  const d = new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function isInPast(dueDate: string, offsetDays: number): boolean {
  const due = new Date(dueDate);
  return (
    new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000) <= new Date()
  );
}

const TEMPLATE_LABELS: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

type SendPhase = "configure" | "confirmed";

function CreateInvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendModal, setSendModal] = useState(false);
  const [sendPhase, setSendPhase] = useState<SendPhase>("configure");
  const [sendChannels, setSendChannels] = useState<("EMAIL" | "WHATSAPP")[]>([
    "EMAIL",
  ]);
  const [followUpSteps, setFollowUpSteps] = useState<FollowUpStepConfig[]>(
    buildDefaultFollowUpSteps(false),
  );
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<FollowUpStepConfig[]>(
    [],
  );

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );
  const taxAmount = (subtotal * (parseFloat(tax) || 0)) / 100;
  const total = subtotal + taxAmount;

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const client = clients.find((c) => c.id === newClientId);
    setFollowUpSteps(buildDefaultFollowUpSteps(!!client?.phone));
    if (client?.phone && !sendChannels.includes("WHATSAPP")) {
      setSendChannels(["EMAIL", "WHATSAPP"]);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => api.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Invoice saved as draft", "success");
      router.push(`/invoices/${invoice.id}`);
    },
    onError: () => toast("Failed to create invoice", "error"),
  });

  const createAndSendMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => api.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setPendingInvoiceId(invoice.id);
      setSendPhase("configure");
      setSendModal(true);
    },
    onError: () => toast("Failed to create invoice", "error"),
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next["title"] = "Title is required";
    if (!clientId) next["clientId"] = "Select a client";
    if (!dueDate) next["dueDate"] = "Due date is required";
    if (items.some((i) => !i.description || !i.unitPrice))
      next["items"] = "All items must have a description and price";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): CreateInvoiceInput => ({
    title,
    clientId,
    dueDate: new Date(dueDate).toISOString(),
    tax: parseFloat(tax) > 0 ? taxAmount : 0,
    notes: notes || undefined,
    items: items.map((i) => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
    })),
  });

  const handleSaveDraft = () => {
    if (!validate()) return;
    createMutation.mutate(buildPayload());
  };

  const handleSendNow = () => {
    if (!validate()) return;
    createAndSendMutation.mutate(buildPayload());
  };

  const handleConfirmSend = async () => {
    if (!pendingInvoiceId || sendChannels.length === 0) return;
    setIsSending(true);
    try {
      await api.sendInvoice(pendingInvoiceId, sendChannels, followUpSteps);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["invoice", pendingInvoiceId],
      });
      setConfirmedSteps(followUpSteps);
      setSendPhase("confirmed");
    } catch {
      toast(
        "Invoice saved but failed to send. You can retry from the invoice page.",
        "error",
      );
      router.push(`/invoices/${pendingInvoiceId}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleModalClose = () => {
    if (isSending) return;
    setSendModal(false);
    if (pendingInvoiceId) router.push(`/invoices/${pendingInvoiceId}`);
  };

  const toggleChannel = (ch: "EMAIL" | "WHATSAPP") => {
    setSendChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const activeConfirmedSteps = confirmedSteps.filter(
    (s) => s.enabled && !isInPast(dueDate, s.offsetDays),
  );

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "" },
    ]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof LineItem, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  const minDate = new Date().toISOString().split("T")[0] as string;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">New Invoice</h1>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Invoice Details
        </h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Website Design"
          error={errors["title"]}
        />
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => handleClientChange(e.target.value)}
          error={errors["clientId"]}
        >
          <option value="">Select a client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={minDate}
          error={errors["dueDate"]}
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Line Items
        </h2>
        {errors["items"] && (
          <p className="text-sm text-error-600">{errors["items"]}</p>
        )}
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                />
              </div>
              <div className="w-16">
                <Input
                  placeholder="Qty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="w-28">
                <Input
                  placeholder="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                  prefix="₦"
                />
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(idx)}
                  className="h-11 w-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 flex-shrink-0 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="text-sm text-primary-600 font-medium hover:underline text-left"
        >
          + Add item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Additional
        </h2>
        <Input
          label="Tax (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
          suffix="%"
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, bank details, or any other notes..."
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          {parseFloat(tax) > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Tax ({tax}%)</span>
              <span className="tabular-nums">{formatNaira(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-neutral-900 text-base border-t-2 border-neutral-200 pt-2 mt-1">
            <span>Total</span>
            <span className="tabular-nums">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-4">
        <Button
          variant="secondary"
          onClick={handleSaveDraft}
          loading={createMutation.isPending}
          className="flex-1"
        >
          Save as Draft
        </Button>
        <Button
          onClick={handleSendNow}
          loading={createAndSendMutation.isPending}
          className="flex-1"
        >
          Send Now
        </Button>
      </div>

      <Modal
        open={sendModal}
        onClose={handleModalClose}
        title={
          sendPhase === "confirmed" ? "Collection agent active" : "Send Invoice"
        }
        footer={
          sendPhase === "configure" ? (
            <>
              <Button
                variant="secondary"
                onClick={handleModalClose}
                disabled={isSending}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleConfirmSend}
                loading={isSending}
                disabled={sendChannels.length === 0}
              >
                Send Invoice
              </Button>
            </>
          ) : (
            <Button
              onClick={() =>
                pendingInvoiceId && router.push(`/invoices/${pendingInvoiceId}`)
              }
              className="w-full"
            >
              View Invoice
            </Button>
          )
        }
      >
        {sendPhase === "configure" ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700">
                Deliver invoice to{" "}
                <span className="text-neutral-900">
                  {selectedClient?.name ?? "client"}
                </span>{" "}
                via:
              </p>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={sendChannels.includes("EMAIL")}
                  onChange={() => toggleChannel("EMAIL")}
                  className="w-4 h-4 text-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Email</p>
                  {selectedClient?.email && (
                    <p className="text-xs text-neutral-500">
                      {selectedClient.email}
                    </p>
                  )}
                </div>
              </label>
              {selectedClient?.phone ? (
                <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={sendChannels.includes("WHATSAPP")}
                    onChange={() => toggleChannel("WHATSAPP")}
                    className="w-4 h-4 text-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      WhatsApp
                    </p>
                    <p className="text-xs text-neutral-500">
                      {selectedClient.phone}
                    </p>
                  </div>
                </label>
              ) : (
                <p className="text-xs text-neutral-400 px-1">
                  Add a phone number to this client to enable WhatsApp delivery.
                </p>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Automatic follow-up sequence
              </p>
              <FollowUpTimeline
                dueDate={dueDate}
                hasPhone={!!selectedClient?.phone}
                steps={followUpSteps}
                onChange={setFollowUpSteps}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-success-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-neutral-900">
                Invoice sent
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                Your collection agent is now active
              </p>
            </div>
            {activeConfirmedSteps.length > 0 ? (
              <div className="w-full bg-neutral-50 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Scheduled follow-ups
                </p>
                {activeConfirmedSteps.map((step) => (
                  <div
                    key={step.template}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-700">
                      {TEMPLATE_LABELS[step.template]}
                    </span>
                    <span className="text-xs font-medium text-primary-600 tabular-nums">
                      {computeScheduledDate(dueDate, step.offsetDays)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center">
                No follow-ups were scheduled — all steps were in the past or
                disabled.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense>
      <CreateInvoicePageInner />
    </Suspense>
  );
}
