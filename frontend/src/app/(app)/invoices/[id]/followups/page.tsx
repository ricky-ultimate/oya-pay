"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api, Invoice, FollowUpActivity, FollowUpSchedule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EscalateModal } from "@/components/invoices/escalate-modal";
import { MessagePreviewButton } from "@/components/invoices/message-preview";
import { useToast } from "@/components/ui/toast";

const templateLabels: Record<string, string> = {
  INVOICE_SENT: "Invoice Sent",
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Scheduled", className: "bg-warning-50 text-warning-700" },
  PAUSED: { label: "Paused", className: "bg-neutral-100 text-neutral-500" },
  SENT: { label: "Sent", className: "bg-success-50 text-success-700" },
  FAILED: { label: "Failed", className: "bg-error-50 text-error-700" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-400",
  },
};

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig["PENDING"]!;
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "WHATSAPP") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
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
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      Email
    </span>
  );
}

export default function FollowUpsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [escalateModal, setEscalateModal] = useState(false);

  const { data: invoice } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => api.getInvoice(id),
  });

  const { data: activity, isLoading } = useQuery<FollowUpActivity>({
    queryKey: ["followups", id],
    queryFn: () => api.getFollowUpActivity(id),
    refetchInterval: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (scheduleId: string) => api.cancelFollowUp(id, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast("Follow-up cancelled", "success");
      setCancelTarget(null);
    },
    onError: () => toast("Failed to cancel follow-up", "error"),
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseFollowUps(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
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
      queryClient.invalidateQueries({ queryKey: ["followups", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast(
        `${data.count} follow-up${data.count !== 1 ? "s" : ""} resumed`,
        "success",
      );
    },
    onError: () => toast("Failed to resume follow-ups", "error"),
  });

  const schedules = activity?.schedules ?? [];
  const logs = activity?.logs ?? [];

  const pending = schedules.filter((s) => s.status === "PENDING");
  const paused = schedules.filter((s) => s.status === "PAUSED");
  const completed = schedules.filter(
    (s) => s.status !== "PENDING" && s.status !== "PAUSED",
  );

  const hasActiveSequence = pending.length > 0 || paused.length > 0;
  const isSequencePaused = paused.length > 0 && pending.length === 0;
  const hasPhone = !!invoice?.client?.phone;
  const canEscalate =
    invoice &&
    !["PAID", "CANCELLED"].includes(invoice.status) &&
    invoice.sentAt;

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
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-neutral-900">Follow-ups</h1>
          {invoice && (
            <p className="text-sm text-neutral-500">
              {invoice.title} · {invoice.invoiceNumber}
            </p>
          )}
        </div>
        <Link href={`/invoices/${id}`}>
          <Button variant="secondary" size="sm">
            View Invoice
          </Button>
        </Link>
      </div>

      {hasActiveSequence && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={[
                "w-2 h-2 rounded-full",
                isSequencePaused ? "bg-neutral-400" : "bg-success-500",
              ].join(" ")}
            />
            <p className="text-sm font-medium text-neutral-900">
              {isSequencePaused
                ? "Sequence paused"
                : `${pending.length} follow-up${pending.length !== 1 ? "s" : ""} pending`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEscalate && (
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
                Escalate now
              </button>
            )}
            {!isSequencePaused ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => pauseMutation.mutate()}
                loading={pauseMutation.isPending}
              >
                Pause sequence
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => resumeMutation.mutate()}
                loading={resumeMutation.isPending}
              >
                Resume sequence
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          {(pending.length > 0 || paused.length > 0) && (
            <div className="bg-white rounded-xl border border-neutral-200">
              <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Scheduled
                </h2>
                <span className="text-xs text-neutral-400">
                  {pending.length} pending
                  {paused.length > 0 ? ` · ${paused.length} paused` : ""}
                </span>
              </div>
              <div className="divide-y divide-neutral-100">
                {[...pending, ...paused].map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    invoiceId={id}
                    schedule={schedule}
                    onCancel={() => setCancelTarget(schedule.id)}
                    onSent={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["followups", id],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["invoice", id],
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && paused.length === 0 && (
            <div className="bg-white rounded-xl border border-neutral-200">
              <div className="px-5 py-3.5 border-b border-neutral-200">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Scheduled
                </h2>
              </div>
              <div className="px-5 py-8 text-center text-sm text-neutral-500">
                No pending follow-ups. Send the invoice to schedule automatic
                reminders.
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200">
              <div className="px-5 py-3.5 border-b border-neutral-200">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Completed
                </h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {completed.map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    invoiceId={id}
                    schedule={schedule}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                Send Log
              </h2>
              <span className="text-xs text-neutral-400">
                {logs.length} entries
              </span>
            </div>
            {logs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">
                No messages have been sent yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="px-5 py-3.5 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ChannelIcon channel={log.channel} />
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            log.status === "SENT"
                              ? "bg-success-50 text-success-700"
                              : "bg-error-50 text-error-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 truncate">
                        {log.message}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {formatDateTime(log.sentAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canEscalate && !hasActiveSequence && (
            <div className="flex justify-center">
              <button
                onClick={() => setEscalateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning-50 text-warning-700 text-sm font-medium hover:bg-warning-100 transition-colors"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Send a follow-up now
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
        title="Cancel Follow-up"
        message="This scheduled follow-up will be cancelled and will not be sent. This cannot be undone."
        confirmLabel="Cancel Follow-up"
        loading={cancelMutation.isPending}
      />

      <EscalateModal
        invoiceId={id}
        hasPhone={hasPhone}
        open={escalateModal}
        onClose={() => setEscalateModal(false)}
        onSent={() => {
          setEscalateModal(false);
          queryClient.invalidateQueries({ queryKey: ["followups", id] });
          queryClient.invalidateQueries({ queryKey: ["invoice", id] });
        }}
      />
    </div>
  );
}

interface ScheduleRowProps {
  invoiceId: string;
  schedule: FollowUpSchedule;
  onCancel?: () => void;
  onSent?: () => void;
}

function ScheduleRow({
  invoiceId,
  schedule,
  onCancel,
  onSent,
}: ScheduleRowProps) {
  const isPast = new Date(schedule.scheduledAt) < new Date();
  const isActionable =
    schedule.status === "PENDING" || schedule.status === "PAUSED";

  return (
    <div className="px-5 py-3.5 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium text-neutral-900">
            {templateLabels[schedule.template] ?? schedule.template}
          </span>
          <StatusPill status={schedule.status} />
        </div>
        <div className="flex items-center gap-3">
          <ChannelIcon channel={schedule.channel} />
          <span className="text-xs text-neutral-500">
            {schedule.status === "SENT" && schedule.sentAt
              ? `Sent ${formatDateTime(schedule.sentAt)}`
              : isPast && isActionable
                ? `Overdue — was ${formatDateTime(schedule.scheduledAt)}`
                : `Scheduled for ${formatDateTime(schedule.scheduledAt)}`}
          </span>
        </div>
      </div>
      {isActionable && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <MessagePreviewButton
            invoiceId={invoiceId}
            scheduleId={schedule.id}
            template={schedule.template}
            channel={schedule.channel}
            onSent={onSent}
          />
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-shrink-0 text-xs text-error-600 font-medium hover:underline px-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
