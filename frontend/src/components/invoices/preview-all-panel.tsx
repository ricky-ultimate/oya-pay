"use client";

import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpSchedule } from "@/types";
import { IconWhatsApp, IconEmail } from "@/components/ui/icons";
import { TEMPLATE_LABELS } from "@/utils/constants";
import { formatDateTime } from "@/utils/format";

function PreviewCard({
  invoiceId,
  schedule,
}: {
  invoiceId: string;
  schedule: FollowUpSchedule;
}) {
  const results = useQueries({
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

  const emailPreview = results[0];
  const waPreview = results[1];
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
              <IconWhatsApp className="w-3.5 h-3.5" /> WhatsApp
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
              <IconEmail className="w-3.5 h-3.5" /> Email
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

export function PreviewAllPanel({
  invoiceId,
  schedules,
}: {
  invoiceId: string;
  schedules: FollowUpSchedule[];
}) {
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
