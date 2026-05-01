"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type {
  Invoice,
  FollowUpActivity,
  FollowUpSchedule,
  FollowUpLog,
} from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { SectionCard } from "@/components/ui/section-card";
import {
  IconWhatsApp,
  IconEmail,
  IconEye,
  IconBolt,
} from "@/components/ui/icons";
import { WhatsAppMockup } from "@/components/ui/whatsapp-mockup";
import { EscalateModal } from "@/components/invoices/escalate-modal";
import { EscalateButton } from "@/components/invoices/escalate-button";
import { MessagePreviewButton } from "@/components/invoices/message-preview";
import { PreviewAllPanel } from "@/components/invoices/preview-all-panel";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/utils/format";
import { TEMPLATE_LABELS } from "@/utils/constants";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Scheduled", className: "bg-warning-50 text-warning-700" },
  PAUSED: { label: "Paused", className: "bg-neutral-100 text-neutral-600" },
  SENT: { label: "Sent", className: "bg-success-50 text-success-700" },
  FAILED: { label: "Failed", className: "bg-error-50 text-error-700" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-400",
  },
};

function StatusPill({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["PENDING"]!;
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ChannelLabel({ channel }: { channel: string }) {
  if (channel === "WHATSAPP") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
        <IconWhatsApp className="w-3.5 h-3.5" /> WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
      <IconEmail className="w-3.5 h-3.5" /> Email
    </span>
  );
}

function LogEntry({ log }: { log: FollowUpLog }) {
  const isWhatsApp = log.channel === "WHATSAPP";
  const isSent = log.status === "SENT";

  const deliveryLabel = isWhatsApp
    ? isSent
      ? "Message delivered to WhatsApp"
      : "WhatsApp delivery failed"
    : isSent
      ? "Email sent to client"
      : "Email delivery failed";

  const iconColor = isSent
    ? isWhatsApp
      ? "text-brand-green"
      : "text-primary-600"
    : "text-error-600";
  const bgColor = isSent
    ? isWhatsApp
      ? "bg-success-50"
      : "bg-primary-50"
    : "bg-error-50";

  return (
    <div className="px-5 py-4 flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${bgColor}`}
      >
        {isWhatsApp ? (
          <IconWhatsApp className={`w-4 h-4 ${iconColor}`} />
        ) : (
          <IconEmail className={`w-4 h-4 ${iconColor}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-neutral-900">
            {deliveryLabel}
          </p>
          {!isSent && (
            <span className="text-xs bg-error-50 text-error-700 px-1.5 py-0.5 rounded font-medium">
              Failed
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {log.message}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {formatDateTime(log.sentAt)}
        </p>
      </div>
    </div>
  );
}

function InlineWhatsAppPreview({
  invoiceId,
  template,
}: {
  invoiceId: string;
  template: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: preview, isLoading } = useQuery({
    queryKey: ["followup-preview", invoiceId, template, "WHATSAPP"],
    queryFn: () => api.previewFollowUp(invoiceId, template, "WHATSAPP"),
    enabled: expanded,
    staleTime: 300_000,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-green transition-colors mt-1"
      >
        <IconWhatsApp className="w-3 h-3" />
        {expanded ? "Hide preview" : "Preview WhatsApp message"}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {expanded && (
        <div className="mt-3">
          <WhatsAppMockup
            message={preview?.whatsapp ?? ""}
            loading={isLoading}
          />
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  invoiceId,
  schedule,
  onCancel,
  onSent,
}: {
  invoiceId: string;
  schedule: FollowUpSchedule;
  onCancel?: () => void;
  onSent?: () => void;
}) {
  const isPast = new Date(schedule.scheduledAt) < new Date();
  const isActionable =
    schedule.status === "PENDING" || schedule.status === "PAUSED";

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-neutral-900">
              {TEMPLATE_LABELS[schedule.template] ?? schedule.template}
            </span>
            <StatusPill status={schedule.status} />
          </div>
          <div className="flex items-center gap-3">
            <ChannelLabel channel={schedule.channel} />
            <span className="text-xs text-neutral-500">
              {schedule.status === "SENT" && schedule.sentAt
                ? `Sent ${formatDateTime(schedule.sentAt)}`
                : isPast && isActionable
                  ? `Overdue — was ${formatDateTime(schedule.scheduledAt)}`
                  : `Scheduled for ${formatDateTime(schedule.scheduledAt)}`}
            </span>
          </div>
          {schedule.channel === "WHATSAPP" && isActionable && (
            <InlineWhatsAppPreview
              invoiceId={invoiceId}
              template={schedule.template}
            />
          )}
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
                className="text-xs text-error-600 font-medium hover:underline px-1 flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FollowUpsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [escalateModal, setEscalateModal] = useState(false);
  const [previewAllOpen, setPreviewAllOpen] = useState(false);

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
  const activeSchedules = [...pending, ...paused];
  const hasActiveSequence = activeSchedules.length > 0;
  const isSequencePaused = paused.length > 0 && pending.length === 0;
  const hasPhone = !!invoice?.client?.phone;
  const canEscalate =
    invoice &&
    !["PAID", "CANCELLED"].includes(invoice.status) &&
    !!invoice.sentAt;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["followups", id] });
    queryClient.invalidateQueries({ queryKey: ["invoice", id] });
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
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
            Invoice
          </Button>
        </Link>
      </div>

      {hasActiveSequence && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={[
                "w-2 h-2 rounded-full flex-shrink-0",
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
              <EscalateButton onClick={() => setEscalateModal(true)} />
            )}
            {!isSequencePaused ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => pauseMutation.mutate()}
                loading={pauseMutation.isPending}
              >
                Pause
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => resumeMutation.mutate()}
                loading={resumeMutation.isPending}
              >
                Resume
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
          <SectionCard
            title="Scheduled"
            headerRight={
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">
                  {activeSchedules.length} active
                </span>
                {activeSchedules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewAllOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors"
                  >
                    <IconEye className="w-3.5 h-3.5" />
                    {previewAllOpen ? "Hide previews" : "Preview all messages"}
                  </button>
                )}
              </div>
            }
          >
            {activeSchedules.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">
                No pending follow-ups. Send the invoice to schedule automatic
                reminders.
              </div>
            ) : (
              <>
                <div className="divide-y divide-neutral-100">
                  {activeSchedules.map((schedule) => (
                    <ScheduleRow
                      key={schedule.id}
                      invoiceId={id}
                      schedule={schedule}
                      onCancel={() => setCancelTarget(schedule.id)}
                      onSent={invalidateAll}
                    />
                  ))}
                </div>
                {previewAllOpen && (
                  <div className="border-t border-neutral-200 p-5">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
                      All scheduled message previews
                    </p>
                    <PreviewAllPanel
                      invoiceId={id}
                      schedules={activeSchedules}
                    />
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {completed.length > 0 && (
            <SectionCard title="Completed">
              <div className="divide-y divide-neutral-100">
                {completed.map((schedule) => (
                  <ScheduleRow
                    key={schedule.id}
                    invoiceId={id}
                    schedule={schedule}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Send Log"
            headerRight={
              <span className="text-xs text-neutral-400">
                {logs.length} entries
              </span>
            }
          >
            {logs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">
                No messages have been sent yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            )}
          </SectionCard>

          {canEscalate && !hasActiveSequence && (
            <div className="flex justify-center">
              <button
                onClick={() => setEscalateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-warning-200 bg-warning-50 text-warning-700 text-sm font-medium hover:bg-warning-100 transition-colors"
              >
                <IconBolt />
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

      {invoice && (
        <EscalateModal
          invoiceId={id}
          hasPhone={hasPhone}
          open={escalateModal}
          initialChannel={hasPhone ? "WHATSAPP" : "EMAIL"}
          onClose={() => setEscalateModal(false)}
          onSent={() => {
            setEscalateModal(false);
            invalidateAll();
          }}
        />
      )}
    </div>
  );
}
