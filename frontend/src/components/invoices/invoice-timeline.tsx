"use client";

import type { FollowUpSchedule, FollowUpLog } from "@/types";
import { IconWhatsApp, IconEmail } from "@/components/ui/icons";
import { formatShortDate } from "@/utils/format";

interface TimelineNode {
  key: string;
  label: string;
  sublabel: string | null;
  channels: string[];
  date: Date;
  status: "sent" | "pending" | "paused" | "failed" | "cancelled" | "today";
  isSentLog: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  INVOICE_SENT: "Sent",
  PRE_DUE_REMINDER: "Pre-due",
  FIRST_OVERDUE: "1-day overdue",
  SECOND_OVERDUE: "1 week overdue",
  FINAL_NOTICE: "Final notice",
};

function relativeLabel(date: Date, now: Date): string {
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

function ChannelPips({ channels }: { channels: string[] }) {
  return (
    <div className="flex items-center gap-1 justify-center mt-0.5">
      {channels.includes("EMAIL") && (
        <IconEmail className="w-3 h-3 text-primary-500" />
      )}
      {channels.includes("WHATSAPP") && (
        <IconWhatsApp className="w-3 h-3 text-brand-green" />
      )}
    </div>
  );
}

function NodeDot({ status }: { status: TimelineNode["status"] }) {
  const styles: Record<typeof status, string> = {
    sent: "bg-success-500 ring-2 ring-success-200",
    today: "bg-primary-500 ring-2 ring-primary-200",
    failed: "bg-error-500 ring-2 ring-error-200",
    cancelled: "bg-neutral-200",
    paused: "bg-neutral-300 ring-2 ring-neutral-100",
    pending: "border-2 border-neutral-300 bg-white",
  };
  return (
    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${styles[status]}`} />
  );
}

function buildNodes(
  schedules: FollowUpSchedule[],
  logs: FollowUpLog[],
  sentAt: string | null,
): TimelineNode[] {
  const now = new Date();
  const nodes: TimelineNode[] = [];

  const sentLog = logs
    .filter((l) => l.status === "SENT")
    .sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    )[0];
  const sentChannels = sentAt
    ? [
        ...new Set(
          logs
            .filter(
              (l) =>
                Math.abs(
                  new Date(l.sentAt).getTime() - new Date(sentAt).getTime(),
                ) < 300_000,
            )
            .map((l) => l.channel),
        ),
      ]
    : [];

  if (sentAt) {
    nodes.push({
      key: "sent",
      label: "Sent",
      sublabel: formatShortDate(new Date(sentAt)),
      channels:
        sentChannels.length > 0
          ? sentChannels
          : sentLog
            ? [sentLog.channel]
            : [],
      date: new Date(sentAt),
      status: "sent",
      isSentLog: true,
    });
  } else {
    nodes.push({
      key: "today",
      label: "Today",
      sublabel: formatShortDate(now),
      channels: [],
      date: now,
      status: "today",
      isSentLog: false,
    });
  }

  const templateOrder = [
    "PRE_DUE_REMINDER",
    "FIRST_OVERDUE",
    "SECOND_OVERDUE",
    "FINAL_NOTICE",
  ];
  const grouped = new Map<string, FollowUpSchedule[]>();
  for (const s of schedules) {
    const existing = grouped.get(s.template) ?? [];
    existing.push(s);
    grouped.set(s.template, existing);
  }

  for (const template of templateOrder) {
    const group = grouped.get(template);
    if (!group || group.length === 0) continue;

    const representative = group[0]!;
    const channels = group.map((s) => s.channel);
    const scheduledAt = new Date(representative.scheduledAt);

    let status: TimelineNode["status"] = "pending";
    if (representative.status === "SENT") status = "sent";
    else if (representative.status === "FAILED") status = "failed";
    else if (representative.status === "CANCELLED") status = "cancelled";
    else if (representative.status === "PAUSED") status = "paused";

    const isPast = scheduledAt < now;
    const sub =
      status === "sent"
        ? formatShortDate(scheduledAt)
        : status === "cancelled"
          ? "cancelled"
          : isPast && status === "pending"
            ? "overdue"
            : relativeLabel(scheduledAt, now);

    nodes.push({
      key: template,
      label: TEMPLATE_LABELS[template] ?? template,
      sublabel: sub,
      channels,
      date: scheduledAt,
      status,
      isSentLog: false,
    });
  }

  return nodes;
}

export function InvoiceTimeline({
  schedules,
  logs,
  sentAt,
}: {
  schedules: FollowUpSchedule[];
  logs: FollowUpLog[];
  sentAt: string | null;
}) {
  const nodes = buildNodes(schedules, logs, sentAt);
  if (nodes.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 overflow-x-auto">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
        Collection timeline
      </p>
      <div className="flex items-start min-w-max">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          return (
            <div key={node.key} className="flex items-start">
              <div className="flex flex-col items-center w-28">
                <div className="text-xs font-semibold text-neutral-700 text-center leading-tight min-h-8 flex items-end justify-center pb-1">
                  {node.label}
                </div>
                <NodeDot status={node.status} />
                <div className="mt-1.5 flex flex-col items-center gap-0.5">
                  {node.sublabel && (
                    <span
                      className={[
                        "text-xs text-center leading-tight",
                        node.status === "sent"
                          ? "text-success-600 font-medium"
                          : node.status === "failed"
                            ? "text-error-600 font-medium"
                            : node.status === "cancelled"
                              ? "text-neutral-400 line-through"
                              : node.status === "paused"
                                ? "text-neutral-400"
                                : "text-neutral-500",
                      ].join(" ")}
                    >
                      {node.sublabel}
                    </span>
                  )}
                  {node.channels.length > 0 && (
                    <ChannelPips channels={node.channels} />
                  )}
                </div>
              </div>
              {!isLast && (
                <div className="flex-shrink-0 w-8 flex items-center mt-8">
                  <div className="w-full h-px bg-neutral-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
