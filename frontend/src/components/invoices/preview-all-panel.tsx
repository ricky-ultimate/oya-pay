"use client";

import { useQueries } from "@tanstack/react-query";
import { api, FollowUpSchedule } from "@/lib/api";

const TEMPLATE_LABELS: Record<string, string> = {
  INVOICE_SENT: "Invoice Sent",
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
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

interface PreviewCardProps {
  invoiceId: string;
  schedule: FollowUpSchedule;
}

function PreviewCard({ invoiceId, schedule }: PreviewCardProps) {
  const emailQuery = useQueries({
    queries: [
      {
        queryKey: ["followup-preview", invoiceId, schedule.template, "EMAIL"],
        queryFn: () =>
          api.previewFollowUp(invoiceId, schedule.template, "EMAIL"),
        staleTime: 300_000,
      },
      {
        queryKey: [
          "followup-preview",
          invoiceId,
          schedule.template,
          "WHATSAPP",
        ],
        queryFn: () =>
          api.previewFollowUp(invoiceId, schedule.template, "WHATSAPP"),
        staleTime: 300_000,
      },
    ],
  });

  const emailPreview = emailQuery[0];
  const waPreview = emailQuery[1];
  const isLoading = emailPreview.isLoading || waPreview.isLoading;

  const isPast = new Date(schedule.scheduledAt) < new Date();

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-900">
            {TEMPLATE_LABELS[schedule.template] ?? schedule.template}
          </span>
          {schedule.channel === "WHATSAPP" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </span>
          ) : (
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
          )}
        </div>
        <span
          className={[
            "text-xs tabular-nums flex-shrink-0",
            isPast ? "text-error-600 font-medium" : "text-neutral-500",
          ].join(" ")}
        >
          {isPast ? "Was " : ""}
          {formatDateTime(schedule.scheduledAt)}
        </span>
      </div>

      {isLoading ? (
        <div className="p-4 flex flex-col gap-3">
          <div className="h-4 bg-neutral-100 rounded animate-pulse w-2/3" />
          <div className="h-16 bg-neutral-100 rounded animate-pulse" />
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {schedule.channel === "EMAIL" && emailPreview.data && (
            <div className="p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                Email
              </p>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Subject:{" "}
                    <span className="font-medium text-neutral-900">
                      {emailPreview.data.email.subject}
                    </span>
                  </p>
                </div>
                <div
                  className="p-3 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: emailPreview.data.email.html,
                  }}
                />
              </div>
            </div>
          )}

          {schedule.channel === "WHATSAPP" && waPreview.data && (
            <div className="p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                WhatsApp
              </p>
              <div className="bg-[#ece5dd] rounded-lg p-3">
                <div className="flex justify-end">
                  <div className="max-w-xs bg-[#dcf8c6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                    <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                      {waPreview.data.whatsapp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PreviewAllPanelProps {
  invoiceId: string;
  schedules: FollowUpSchedule[];
}

export function PreviewAllPanel({
  invoiceId,
  schedules,
}: PreviewAllPanelProps) {
  const actionable = schedules.filter(
    (s) => s.status === "PENDING" || s.status === "PAUSED",
  );

  if (actionable.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {actionable.map((schedule) => (
        <PreviewCard
          key={schedule.id}
          invoiceId={invoiceId}
          schedule={schedule}
        />
      ))}
    </div>
  );
}
