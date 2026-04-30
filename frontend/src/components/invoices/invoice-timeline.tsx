"use client";

import { FollowUpSchedule, FollowUpLog } from "@/lib/api";

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

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function relativeLabel(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
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
      {channels.includes("WHATSAPP") && (
        <svg
          className="w-3 h-3 text-brand-green"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )}
    </div>
  );
}

interface NodeDotProps {
  status: TimelineNode["status"];
}

function NodeDot({ status }: NodeDotProps) {
  if (status === "sent") {
    return (
      <div className="w-3 h-3 rounded-full bg-success-500 ring-2 ring-success-200 flex-shrink-0" />
    );
  }
  if (status === "today") {
    return (
      <div className="w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-200 flex-shrink-0" />
    );
  }
  if (status === "failed") {
    return (
      <div className="w-3 h-3 rounded-full bg-error-500 ring-2 ring-error-200 flex-shrink-0" />
    );
  }
  if (status === "cancelled") {
    return (
      <div className="w-3 h-3 rounded-full bg-neutral-200 flex-shrink-0" />
    );
  }
  if (status === "paused") {
    return (
      <div className="w-3 h-3 rounded-full bg-neutral-300 ring-2 ring-neutral-100 flex-shrink-0" />
    );
  }
  return (
    <div className="w-3 h-3 rounded-full border-2 border-neutral-300 bg-white flex-shrink-0" />
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

  const sentChannels = logs
    .filter(
      (l) =>
        sentAt &&
        Math.abs(new Date(l.sentAt).getTime() - new Date(sentAt).getTime()) <
          60_000 * 5,
    )
    .map((l) => l.channel);

  const uniqueSentChannels = [...new Set(sentChannels)];

  if (sentAt) {
    const sentDate = new Date(sentAt);
    nodes.push({
      key: "sent",
      label: "Sent",
      sublabel: formatShortDate(sentDate),
      channels:
        uniqueSentChannels.length > 0
          ? uniqueSentChannels
          : sentLog
            ? [sentLog.channel]
            : [],
      date: sentDate,
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

interface InvoiceTimelineProps {
  schedules: FollowUpSchedule[];
  logs: FollowUpLog[];
  sentAt: string | null;
}

export function InvoiceTimeline({
  schedules,
  logs,
  sentAt,
}: InvoiceTimelineProps) {
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
