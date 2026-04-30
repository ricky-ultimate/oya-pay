"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, buildDefaultFollowUpSteps } from "@/lib/api";
import type {
  Invoice,
  InvoiceStatus,
  FollowUpStepConfig,
  FollowUpActivity,
} from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppMockup } from "@/components/ui/whatsapp-mockup";
import { FollowUpTimeline } from "@/components/invoices/follow-up-timeline";
import { EscalateModal } from "@/components/invoices/escalate-modal";
import { InvoiceTimeline } from "@/components/invoices/invoice-timeline";
import { useToast } from "@/components/ui/toast";
import { formatNaira, formatDate } from "@/utils/format";
import { computeScheduledDate, isInPast } from "@/utils/invoice";
import { TEMPLATE_LABELS } from "@/utils/constants";

type SendPhase = "configure" | "confirmed";

function RecoveryBanner({
  amount,
  followUpNumber,
  onDismiss,
}: {
  amount: number;
  followUpNumber: number;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-success-50 border border-success-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-success-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-success-900">
            {formatNaira(amount)} recovered by automated reminder
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
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentModal, setPaymentModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [sendPhase, setSendPhase] = useState<SendPhase>("configure");
  const [deleteModal, setDeleteModal] = useState(false);
  const [escalateModal, setEscalateModal] = useState(false);
  const [escalateInitialChannel, setEscalateInitialChannel] = useState<
    "EMAIL" | "WHATSAPP"
  >("EMAIL");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [sendChannels, setSendChannels] = useState<("EMAIL" | "WHATSAPP")[]>([
    "EMAIL",
  ]);
  const [followUpSteps, setFollowUpSteps] = useState<FollowUpStepConfig[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<FollowUpStepConfig[]>(
    [],
  );
  const [recoveryBannerDismissed, setRecoveryBannerDismissed] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const [justRecoveredAmount, setJustRecoveredAmount] = useState<number | null>(
    null,
  );

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
      const total = Number(invoice.total);
      setJustRecoveredAmount(total);
      toast(`Automated reminder recovered ${formatNaira(total)}`, "success");
    }

    prevStatusRef.current = current;
  }, [invoice, toast]);

  const hasPhone = !!invoice?.client?.phone;

  const { data: invoiceSentPreview, isLoading: previewLoading } = useQuery({
    queryKey: ["followup-preview", id, "INVOICE_SENT", "WHATSAPP"],
    queryFn: () => api.previewFollowUp(id, "INVOICE_SENT", "WHATSAPP"),
    enabled: sendModal && hasPhone && sendPhase === "configure",
    staleTime: 300_000,
  });

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

  const openSendModal = () => {
    if (!invoice) return;
    const phone = !!invoice.client?.phone;
    const steps = buildDefaultFollowUpSteps(phone);
    setFollowUpSteps(steps);
    setSendPhase("configure");
    setSendChannels(phone ? ["WHATSAPP", "EMAIL"] : ["EMAIL"]);
    setSendModal(true);
  };

  const openWhatsAppSend = () => {
    setEscalateInitialChannel("WHATSAPP");
    setEscalateModal(true);
  };

  const handleConfirmSend = async () => {
    if (sendChannels.length === 0 || !invoice) return;
    setIsSending(true);
    try {
      await api.sendInvoice(id, sendChannels, followUpSteps);
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      setConfirmedSteps(followUpSteps);
      setSendPhase("confirmed");
    } catch {
      toast("Failed to send invoice", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendModalClose = () => {
    if (isSending) return;
    setSendModal(false);
  };

  const toggleChannel = (ch: "EMAIL" | "WHATSAPP") => {
    setSendChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

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

  const activeConfirmedSteps = confirmedSteps.filter(
    (s) => s.enabled && !isInPast(invoice.dueDate, s.offsetDays),
  );

  const showTimeline =
    !!invoice.sentAt || (activity?.schedules && activity.schedules.length > 0);

  const showRecoveryBanner =
    !recoveryBannerDismissed &&
    !!invoice.followUpAttribution &&
    (invoice.status === "PAID" || invoice.status === "PARTIAL");

  const showJustRecoveredBanner =
    !recoveryBannerDismissed &&
    justRecoveredAmount !== null &&
    !!invoice.followUpAttribution;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
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

      {(showJustRecoveredBanner || showRecoveryBanner) &&
        invoice.followUpAttribution && (
          <RecoveryBanner
            amount={
              justRecoveredAmount !== null
                ? justRecoveredAmount
                : Number(invoice.total)
            }
            followUpNumber={invoice.followUpAttribution.followUpNumber}
            onDismiss={() => {
              setRecoveryBannerDismissed(true);
              setJustRecoveredAmount(null);
            }}
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
              <svg
                className="w-3 h-3 text-brand-green"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
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
          {invoice.followUpAttribution && (
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
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Notes
          </p>
          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {invoice.notes}
          </p>
        </div>
      )}

      {(invoice.payments?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-3.5 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900">
              Payment History
            </h2>
          </div>
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
        </div>
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
                  <svg
                    className="w-4 h-4 text-neutral-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
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
              <button
                onClick={() => setEscalateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-50 text-warning-700 text-xs font-medium hover:bg-warning-100 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Escalate
              </button>
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
            onClick={openSendModal}
            className="flex-1"
          >
            {invoice.sentAt ? "Send Reminder" : "Send Invoice"}
          </Button>
        )}
        {canSend && hasPhone && invoice.sentAt && (
          <button
            onClick={openWhatsAppSend}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#128C7E] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
        )}
        <Button variant="ghost" onClick={downloadPDF} size="md">
          Download PDF
        </Button>
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
        onClose={handleSendModalClose}
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
                onClick={handleSendModalClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSend}
                loading={isSending}
                disabled={sendChannels.length === 0}
              >
                Send
              </Button>
            </>
          ) : (
            <Button onClick={() => setSendModal(false)} className="w-full">
              Done
            </Button>
          )
        }
      >
        {sendPhase === "configure" ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700">
                Deliver to{" "}
                <span className="text-neutral-900">{invoice.client?.name}</span>{" "}
                via:
              </p>

              {hasPhone ? (
                <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={sendChannels.includes("WHATSAPP")}
                    onChange={() => toggleChannel("WHATSAPP")}
                    className="w-4 h-4 text-success-600 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-green flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <p className="text-sm font-medium text-neutral-900">
                        WhatsApp
                      </p>
                      <span className="text-xs bg-success-50 text-success-700 px-1.5 py-0.5 rounded font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {invoice.client?.phone}
                    </p>
                    {sendChannels.includes("WHATSAPP") && (
                      <div className="mt-3">
                        <WhatsAppMockup
                          message={invoiceSentPreview?.whatsapp ?? ""}
                          loading={previewLoading}
                          senderName={invoice.client?.name}
                        />
                      </div>
                    )}
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200">
                  <svg
                    className="w-4 h-4 text-neutral-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <p className="text-xs text-neutral-500">
                    Add a phone number to this client to enable WhatsApp
                    delivery.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={sendChannels.includes("EMAIL")}
                  onChange={() => toggleChannel("EMAIL")}
                  className="w-4 h-4 text-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Email</p>
                  {invoice.client?.email && (
                    <p className="text-xs text-neutral-500">
                      {invoice.client.email}
                    </p>
                  )}
                </div>
              </label>
            </div>

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
                {invoice.sentAt ? "Reminder sent" : "Invoice sent"}
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                Your collection agent is now active
              </p>
            </div>
            {activeConfirmedSteps.length > 0 && (
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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {step.channels.includes("WHATSAPP") && (
                          <svg
                            className="w-3 h-3 text-brand-green"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        )}
                        {step.channels.includes("EMAIL") && (
                          <svg
                            className="w-3 h-3 text-primary-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-medium text-primary-600 tabular-nums">
                        {computeScheduledDate(invoice.dueDate, step.offsetDays)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
