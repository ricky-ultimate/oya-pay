"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, calculateDueDate } from "@/lib/api";
import type {
  Client,
  ClientStats,
  CreateInvoiceInput,
  InvoiceType,
  Project,
} from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { BackButton } from "@/components/ui/back-button";
import { SectionCard, SectionCardBody } from "@/components/ui/section-card";
import {
  LineItemsEditor,
  LineItem,
} from "@/components/invoices/line-items-editor";
import { InvoiceTotals } from "@/components/invoices/invoice-totals";
import { FollowUpTimeline } from "@/components/invoices/follow-up-timeline";
import { LatePayerBanner } from "@/components/invoices/late-payer-banner";
import { ChannelSelector } from "@/components/invoices/channel-selector";
import { SendConfirmedView } from "@/components/invoices/send-confirmed-view";
import { useToast } from "@/components/ui/toast";
import { useSendInvoice } from "@/hooks/use-send-invoice";

const INVOICE_TYPE_OPTIONS: {
  value: InvoiceType;
  label: string;
  description: string;
}[] = [
  { value: "STANDARD", label: "Standard", description: "Default invoice" },
  {
    value: "DEPOSIT",
    label: "Deposit",
    description: "Due in 5 days, tight reminders",
  },
  {
    value: "MILESTONE",
    label: "Milestone",
    description: "Mid-project delivery",
  },
  { value: "FINAL", label: "Final Payment", description: "Project completion" },
];

function CreateInvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initialProjectId = searchParams.get("projectId") ?? "";
  const initialClientId = searchParams.get("clientId") ?? "";

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId);
  const [clientId, setClientId] = useState(initialClientId);
  const [clientLocked, setClientLocked] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("STANDARD");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [projectsHydrated, setProjectsHydrated] = useState(false);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
  });

  useEffect(() => {
    if (projects.length === 0 || projectsHydrated) return;
    setProjectsHydrated(true);
    if (!initialProjectId) return;
    const project = projects.find((p) => p.id === initialProjectId);
    if (!project) return;
    Promise.resolve().then(() => {
      setClientId(project.clientId);
      setClientLocked(true);
      setDueDate(calculateDueDate("STANDARD", project.paymentTermsDays));
    });
  }, [projects, initialProjectId, projectsHydrated]);

  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    setBannerDismissed(false);
    if (newProjectId) {
      const project = projects.find((p) => p.id === newProjectId);
      if (project) {
        setClientId(project.clientId);
        setClientLocked(true);
        setDueDate(calculateDueDate(invoiceType, project.paymentTermsDays));
      }
    } else {
      setClientLocked(false);
    }
  };

  const handleInvoiceTypeChange = (newType: InvoiceType) => {
    setInvoiceType(newType);
    const selectedProject = projectId
      ? projects.find((p) => p.id === projectId)
      : null;
    setDueDate(
      calculateDueDate(newType, selectedProject?.paymentTermsDays ?? 14),
    );
  };

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setBannerDismissed(false);
    if (!dueDate) {
      setDueDate(calculateDueDate(invoiceType, 14));
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const hasPhone = !!selectedClient?.phone;

  const { data: clientStats } = useQuery<ClientStats>({
    queryKey: ["client-stats", clientId],
    queryFn: () => api.getClientStats(clientId),
    enabled: !!clientId,
    staleTime: 120_000,
  });

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );
  const taxPercent = parseFloat(tax) || 0;
  const taxAmount = (subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount;

  const {
    sendModal,
    sendPhase,
    sendChannels,
    followUpSteps,
    confirmedSteps,
    isSending,
    closeSendModal,
    toggleChannel,
    setFollowUpSteps,
    confirmSend,
    setSendModal,
  } = useSendInvoice({
    invoiceId: pendingInvoiceId ?? "",
    hasPhone,
    dueDate,
    invoiceType,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => api.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setPendingInvoiceId(invoice.id);
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
    projectId: projectId || undefined,
    invoiceType,
    dueDate: new Date(dueDate).toISOString(),
    tax: taxPercent > 0 ? taxAmount : 0,
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

  const handleModalClose = () => {
    if (isSending) return;
    closeSendModal();
    if (pendingInvoiceId) router.push(`/invoices/${pendingInvoiceId}`);
  };

  const showLatePayerBanner =
    !bannerDismissed &&
    !!clientStats &&
    (clientStats.avgDaysLate ?? 0) > 7 &&
    sendPhase === "configure";

  const minDate = new Date().toISOString().split("T")[0] as string;

  const clientsForProject = projectId
    ? clients.filter((c) => c.id === clientId)
    : clients;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-neutral-900">New Invoice</h1>
      </div>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
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
            label="Project (optional)"
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            <option value="">No project — standalone invoice</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.client.name})
              </option>
            ))}
          </Select>
          <Select
            label="Invoice Type"
            value={invoiceType}
            onChange={(e) =>
              handleInvoiceTypeChange(e.target.value as InvoiceType)
            }
          >
            {INVOICE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </Select>
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            error={errors["clientId"]}
            disabled={clientLocked}
          >
            <option value="">Select a client</option>
            {(clientLocked ? clients : clientsForProject).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.phone ? " (WhatsApp)" : ""}
              </option>
            ))}
          </Select>
          {clientLocked && (
            <p className="text-xs text-neutral-400 -mt-2">
              Client is set by the selected project.{" "}
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => handleProjectChange("")}
              >
                Clear project
              </button>
            </p>
          )}
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={minDate}
            error={errors["dueDate"]}
          />
          {invoiceType === "DEPOSIT" && (
            <p className="text-xs text-warning-600 font-medium -mt-2 px-1">
              Deposit invoices use a compressed follow-up sequence (reminder at
              day -1, escalations at +2, +5, +10).
            </p>
          )}
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Line Items
          </h2>
          <LineItemsEditor
            items={items}
            onChange={setItems}
            error={errors["items"]}
          />
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
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
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody>
          <InvoiceTotals
            subtotal={subtotal}
            taxPercent={taxPercent}
            taxAmount={taxAmount}
            total={total}
          />
        </SectionCardBody>
      </SectionCard>

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
                onClick={confirmSend}
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
            {showLatePayerBanner && clientStats && selectedClient && (
              <LatePayerBanner
                clientName={selectedClient.name}
                stats={clientStats}
                steps={followUpSteps}
                onAdjust={setFollowUpSteps}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}
            <ChannelSelector
              clientName={selectedClient?.name ?? "client"}
              clientEmail={selectedClient?.email}
              clientPhone={selectedClient?.phone}
              selectedChannels={sendChannels}
              onToggle={toggleChannel}
            />
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Automatic follow-up sequence
              </p>
              <FollowUpTimeline
                dueDate={dueDate}
                hasPhone={hasPhone}
                steps={followUpSteps}
                onChange={setFollowUpSteps}
              />
            </div>
          </div>
        ) : (
          <SendConfirmedView
            dueDate={dueDate}
            confirmedSteps={confirmedSteps}
          />
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
