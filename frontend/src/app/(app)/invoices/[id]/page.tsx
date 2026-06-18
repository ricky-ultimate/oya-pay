"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Invoice, InvoiceStatus, FollowUpActivity } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { SectionCard, SectionCardBody } from "@/components/ui/section-card";
import {
  IconWhatsApp,
  IconCheckCircle,
  IconX,
  IconClipboard,
  IconPause,
} from "@/components/ui/icons";
import { ChannelSelector } from "@/components/invoices/channel-selector";
import { SendConfirmedView } from "@/components/invoices/send-confirmed-view";
import { FollowUpTimeline } from "@/components/invoices/follow-up-timeline";
import { EscalateModal } from "@/components/invoices/escalate-modal";
import { EscalateButton } from "@/components/invoices/escalate-button";
import { InvoiceTimeline } from "@/components/invoices/invoice-timeline";
import { MessagePreviewToggle } from "@/components/invoices/message-preview-toggle";
import { useToast } from "@/components/ui/toast";
import { useSendInvoice } from "@/hooks/use-send-invoice";
import { formatNaira, formatDate } from "@/utils/format";
import { TEMPLATE_LABELS } from "@/utils/constants";
import { SaveTemplateButton } from "@/components/templates/save-template-button";

function RecoveryBanner({
  recoveredAmount,
  followUpNumber,
  onDismiss,
}: {
  recoveredAmount: number;
  followUpNumber: number;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-success-50 border border-success-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <IconCheckCircle className="w-4 h-4 text-success-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-success-900">
            {formatNaira(recoveredAmount)} recovered by automated reminder
          </p>
          <p className="text-xs text-success-700 mt-0.5">
            Payment arrived within 48 hours of follow-up #{followUpNumber}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-success-600 hover:text-success-800 flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <IconX />
      </button>
    </div>
  );
}

function InvoiceDetailPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentModal, setPaymentModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [escalateModal, setEscalateModal] = useState(false);
  const [escalateInitialChannel, setEscalateInitialChannel] = useState<
    "EMAIL" | "WHATSAPP"
  >("EMAIL");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [recoveryBannerDismissed, setRecoveryBannerDismissed] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => api.getInvoice(id),
  });

  const { data: activity } = useQuery<FollowUpActivity>({
    queryKey: ["followups", id],
    queryFn: () => api.getFollowUpActivity(id),
    enabled: !!invoice,
    staleTime: 30_000,
  });

  const hasPhone = !!invoice?.client?.phone;

  const {
    sendModal,
    sendPhase,
    sendChannels,
    followUpSteps,
    confirmedSteps,
    isSending,
    openSendModal,
    closeSendModal,
    toggleChannel,
    setFollowUpSteps,
    confirmSend,
  } = useSendInvoice({
    invoiceId: id,
    hasPhone,
    dueDate: invoice?.dueDate ?? "",
  });

  const { data: invoiceSentPreview, isLoading: previewLoading } = useQuery({
    queryKey: ["followup-preview", id, "INVOICE_SENT", "WHATSAPP"],
    queryFn: () => api.previewFollowUp(id, "INVOICE_SENT", "WHATSAPP"),
    enabled: sendModal && hasPhone && sendPhase === "configure",
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!invoice) return;
    const prev = prevStatusRef.current;
    const current = invoice.status;
    if (
      prev !== null &&
      prev !== "PAID" &&
      current === "PAID" &&
      invoice.followUpAttribution
    ) {
      const recovered = invoice.followUpAttribution.recoveredAmount;
      toast(
        `Automated reminder recovered ${formatNaira(recovered)}`,
        "success",
      );
    }
    prevStatusRef.current = current;
  }, [invoice, toast]);

  useEffect(() => {
    if (!invoice) return;
    if (searchParams.get("action") !== "send") return;
    if (["PAID", "CANCELLED"].includes(invoice.status)) return;
    openSendModal(!!invoice.client?.phone);
    router.replace(`/invoices/${id}`);
  }, [invoice, searchParams, id, router]);

  const pendingCount =
    invoice?.followUpSchedules?.filter((s) => s.status === "PENDING").length ??
    0;
  const pausedCount =
    invoice?.followUpSchedules?.filter((s) => s.status === "PAUSED").length ??
    0;
  const isSequencePaused = pausedCount > 0 && pendingCount === 0;
  const hasActiveSequence = pendingCount > 0 || pausedCount > 0;

  const logPaymentMutation = useMutation({
    mutationFn: () =>
      api.logPayment({
        invoiceId: id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentRef || undefined,
        note: paymentNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Payment recorded", "success");
      setPaymentModal(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNote("");
    },
    onError: () => toast("Failed to record payment", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice deleted", "success");
      router.push("/invoices");
    },
    onError: () => toast("Failed to delete invoice", "error"),
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseFollowUps(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      toast(
        `${data.count} follow-up${data.count !== 1 ? "s" : ""} paused`,
        "success",
      );
    },
    onError: () => toast("Failed to pause follow-ups", "error"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumeFollowUps(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      toast(
        `${data.count} follow-up${data.count !== 1 ? "s" : ""} resumed`,
        "success",
      );
    },
    onError: () => toast("Failed to resume follow-ups", "error"),
  });

  const downloadPDF = async () => {
    try {
      const blob = await api.downloadInvoicePDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNumber ?? "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Failed to download PDF", "error");
    }
  };

  const copyPaymentLink = async () => {
    try {
      const result = await api.getPaymentLink(id);
      await navigator.clipboard.writeText(result.authorizationUrl);
      toast("Payment link copied", "success");
    } catch {
      toast("Failed to get payment link", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!invoice) return null;

  const canEdit = invoice.status === "DRAFT";
  const canPay = !["PAID", "CANCELLED"].includes(invoice.status);
  const canSend = !["PAID", "CANCELLED"].includes(invoice.status);
  const remainingAmount =
    Number(invoice.total) -
    (invoice.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);

  const showTimeline =
    !!invoice.sentAt || (activity?.schedules && activity.schedules.length > 0);

  const showRecoveryBanner =
    !recoveryBannerDismissed &&
    invoice.status === "PAID" &&
    !!invoice.followUpAttribution;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900">
              {invoice.title}
            </h1>
            <StatusBadge status={invoice.status as InvoiceStatus} />
            {pendingCount > 0 && (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                {pendingCount} follow-up{pendingCount !== 1 ? "s" : ""}{" "}
                scheduled
              </span>
            )}
            {isSequencePaused && (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                sequence paused
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">{invoice.invoiceNumber}</p>
        </div>
        {canEdit && (
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
        )}
      </div>

      {invoice.status === "DRAFT" && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-200">
          <div>
            <p className="text-sm font-semibold text-primary-800">
              This invoice has not been sent yet
            </p>
            <p className="text-xs text-primary-600 mt-0.5">
              Send it now to start collecting payment and activate reminders.
            </p>
          </div>
          <Button size="sm" onClick={() => openSendModal(hasPhone)}>
            Send now
          </Button>
        </div>
      )}

      {showRecoveryBanner && invoice.followUpAttribution && (
        <RecoveryBanner
          recoveredAmount={invoice.followUpAttribution.recoveredAmount}
          followUpNumber={invoice.followUpAttribution.followUpNumber}
          onDismiss={() => setRecoveryBannerDismissed(true)}
        />
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
            Client
          </p>
          <p className="text-sm font-medium text-neutral-900">
            {invoice.client?.name}
          </p>
          <p className="text-xs text-neutral-500">{invoice.client?.email}</p>
          {invoice.client?.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <IconWhatsApp className="w-3 h-3 text-brand-green" />
              <p className="text-xs text-neutral-500">{invoice.client.phone}</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
            Dates
          </p>
          <p className="text-xs text-neutral-600">
            Issued: {formatDate(invoice.issueDate)}
          </p>
          <p className="text-xs text-neutral-600">
            Due: {formatDate(invoice.dueDate)}
          </p>
          {invoice.followUpAttribution && invoice.status === "PAID" && (
            <p className="text-xs text-success-700 font-medium mt-1">
              Paid after follow-up #{invoice.followUpAttribution.followUpNumber}
              {invoice.followUpAttribution.template
                ? ` — ${TEMPLATE_LABELS[invoice.followUpAttribution.template] ?? invoice.followUpAttribution.template}`
                : ""}
            </p>
          )}
        </div>
      </div>

      {showTimeline && (
        <InvoiceTimeline
          schedules={activity?.schedules ?? []}
          logs={activity?.logs ?? []}
          sentAt={invoice.sentAt}
        />
      )}

      <MessagePreviewToggle
        invoiceId={id}
        template="INVOICE_SENT"
        hasPhone={hasPhone}
        senderName={
          invoice.user?.businessName ?? invoice.user?.name ?? "OyaPay"
        }
        alreadySent={!!invoice.sentAt}
      />

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Description
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Qty
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Unit Price
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoice.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-neutral-900">
                  {item.description}
                </td>
                <td className="px-3 py-3 text-right text-neutral-600 tabular-nums">
                  {Number(item.quantity)}
                </td>
                <td className="px-3 py-3 text-right text-neutral-600 tabular-nums">
                  {formatNaira(Number(item.unitPrice))}
                </td>
                <td className="px-5 py-3 text-right font-medium text-neutral-900 tabular-nums">
                  {formatNaira(Number(item.total))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-neutral-200">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-2.5 text-right text-sm text-neutral-500"
              >
                Subtotal
              </td>
              <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums">
                {formatNaira(Number(invoice.subtotal))}
              </td>
            </tr>
            {Number(invoice.tax) > 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-1.5 text-right text-sm text-neutral-500"
                >
                  Tax
                </td>
                <td className="px-5 py-1.5 text-right text-sm tabular-nums">
                  {formatNaira(Number(invoice.tax))}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-neutral-200">
              <td
                colSpan={3}
                className="px-5 py-3 text-right text-base font-semibold text-neutral-900"
              >
                Total
              </td>
              <td className="px-5 py-3 text-right text-base font-bold text-neutral-900 tabular-nums">
                {formatNaira(Number(invoice.total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && (
        <SectionCard>
          <SectionCardBody>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-sm text-neutral-700 whitespace-pre-line">
              {invoice.notes}
            </p>
          </SectionCardBody>
        </SectionCard>
      )}

      {(invoice.payments?.length ?? 0) > 0 && (
        <SectionCard title="Payment History">
          <div className="divide-y divide-neutral-100">
            {invoice.payments?.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatNaira(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payment.method ?? "Unknown"} · {formatDate(payment.paidAt)}
                  </p>
                </div>
                {payment.reference && (
                  <p className="text-xs text-neutral-400 font-mono">
                    {payment.reference}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {hasActiveSequence && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  isSequencePaused ? "bg-neutral-100" : "bg-primary-50",
                ].join(" ")}
              >
                {isSequencePaused ? (
                  <IconPause className="w-4 h-4 text-neutral-500" />
                ) : (
                  <IconClipboard className="w-4 h-4 text-primary-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {isSequencePaused
                    ? "Collection sequence paused"
                    : `${pendingCount} follow-up${pendingCount !== 1 ? "s" : ""} scheduled`}
                </p>
                <p className="text-xs text-neutral-500">
                  {isSequencePaused
                    ? "Resume to continue sending reminders"
                    : "Automatic reminders active"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isSequencePaused ? (
                <button
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                >
                  Resume
                </button>
              )}
              <EscalateButton onClick={() => setEscalateModal(true)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pb-4">
        {canPay && (
          <Button
            onClick={() => {
              setPaymentAmount(
                String(remainingAmount > 0 ? remainingAmount : ""),
              );
              setPaymentModal(true);
            }}
            className="flex-1"
          >
            Record Payment
          </Button>
        )}
        {canSend && (
          <Button
            variant="secondary"
            onClick={() => openSendModal(hasPhone)}
            className="flex-1"
          >
            {invoice.sentAt ? "Send Reminder" : "Send Invoice"}
          </Button>
        )}
        {canSend && hasPhone && invoice.sentAt && (
          <button
            onClick={() => {
              setEscalateInitialChannel("WHATSAPP");
              setEscalateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#128C7E] transition-colors"
          >
            <IconWhatsApp className="w-4 h-4" />
            WhatsApp
          </button>
        )}
        <Button variant="ghost" onClick={downloadPDF} size="md">
          Download PDF
        </Button>
        {invoice.items && invoice.items.length > 0 && (
          <SaveTemplateButton
            title={invoice.title}
            items={(invoice.items ?? []).map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
            }))}
            tax={Number(invoice.tax)}
            notes={invoice.notes}
            currency={invoice.currency}
          />
        )}
        <Link href={`/invoices/${id}/followups`}>
          <Button variant="ghost" size="md">
            Follow-ups
          </Button>
        </Link>
        {!["DRAFT", "CANCELLED"].includes(invoice.status) && (
          <Button variant="ghost" onClick={copyPaymentLink} size="md">
            Copy Link
          </Button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            onClick={() => setDeleteModal(true)}
            size="md"
            className="text-error-600 hover:bg-error-50"
          >
            Delete
          </Button>
        )}
      </div>

      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => logPaymentMutation.mutate()}
              loading={logPaymentMutation.isPending}
              disabled={!paymentAmount}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            prefix="₦"
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="paystack">Paystack</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Reference (optional)"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Transaction reference"
          />
          <Textarea
            label="Note (optional)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>
      </Modal>

      <Modal
        open={sendModal}
        onClose={() => {
          if (!isSending) closeSendModal();
        }}
        title={
          sendPhase === "confirmed"
            ? "Collection agent active"
            : invoice.sentAt
              ? "Send Reminder"
              : "Send Invoice"
        }
        footer={
          sendPhase === "configure" ? (
            <>
              <Button
                variant="secondary"
                onClick={closeSendModal}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSend}
                loading={isSending}
                disabled={sendChannels.length === 0}
              >
                Send
              </Button>
            </>
          ) : (
            <Button onClick={closeSendModal} className="w-full">
              Done
            </Button>
          )
        }
      >
        {sendPhase === "configure" ? (
          <div className="flex flex-col gap-5">
            <ChannelSelector
              clientName={invoice.client?.name ?? ""}
              clientEmail={invoice.client?.email}
              clientPhone={invoice.client?.phone}
              selectedChannels={sendChannels}
              onToggle={toggleChannel}
              whatsAppPreviewMessage={invoiceSentPreview?.whatsapp}
              whatsAppPreviewLoading={previewLoading}
            />
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Automatic follow-up sequence
              </p>
              <FollowUpTimeline
                dueDate={invoice.dueDate}
                hasPhone={hasPhone}
                steps={followUpSteps}
                onChange={setFollowUpSteps}
              />
            </div>
          </div>
        ) : (
          <SendConfirmedView
            dueDate={invoice.dueDate}
            confirmedSteps={confirmedSteps}
            title={invoice.sentAt ? "Reminder sent" : "Invoice sent"}
          />
        )}
      </Modal>

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Invoice"
        message="This invoice will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />

      <EscalateModal
        invoiceId={id}
        hasPhone={hasPhone}
        open={escalateModal}
        initialChannel={escalateInitialChannel}
        onClose={() => setEscalateModal(false)}
        onSent={() => {
          setEscalateModal(false);
          queryClient.invalidateQueries({ queryKey: ["followups", id] });
        }}
      />
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense>
      <InvoiceDetailPageInner />
    </Suspense>
  );
}
