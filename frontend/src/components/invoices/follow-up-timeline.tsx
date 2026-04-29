"use client";

import { FollowUpStepConfig } from "@/lib/api";

const TEMPLATE_LABELS: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

function offsetLabel(offsetDays: number): string {
  if (offsetDays === 0) return "On due date";
  if (offsetDays < 0)
    return `${Math.abs(offsetDays)} day${Math.abs(offsetDays) !== 1 ? "s" : ""} before due`;
  return `${offsetDays} day${offsetDays !== 1 ? "s" : ""} after due`;
}

function computeScheduledDate(dueDate: string, offsetDays: number): string {
  const due = new Date(dueDate);
  const d = new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isInPast(dueDate: string, offsetDays: number): boolean {
  const due = new Date(dueDate);
  const scheduled = new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return scheduled <= new Date();
}

interface FollowUpTimelineProps {
  dueDate: string;
  hasPhone: boolean;
  steps: FollowUpStepConfig[];
  onChange: (steps: FollowUpStepConfig[]) => void;
}

export function FollowUpTimeline({
  dueDate,
  hasPhone,
  steps,
  onChange,
}: FollowUpTimelineProps) {
  const updateStep = (index: number, patch: Partial<FollowUpStepConfig>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const toggleChannel = (stepIndex: number, channel: "EMAIL" | "WHATSAPP") => {
    const step = steps[stepIndex];
    if (!step) return;
    const has = step.channels.includes(channel);
    if (has && step.channels.length === 1) return;
    const channels = has
      ? step.channels.filter((c) => c !== channel)
      : [...step.channels, channel];
    updateStep(stepIndex, { channels });
  };

  const handleOffsetChange = (index: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= -30 && parsed <= 60) {
      updateStep(index, { offsetDays: parsed });
    }
  };

  return (
    <div>
      {steps.map((step, index) => {
        const past = dueDate ? isInPast(dueDate, step.offsetDays) : false;
        const dateLabel = dueDate
          ? computeScheduledDate(dueDate, step.offsetDays)
          : null;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.template} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={[
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0",
                  step.enabled && !past
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-neutral-200 bg-neutral-100 text-neutral-400",
                ].join(" ")}
              >
                {index + 1}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-neutral-200 my-1 min-h-4" />
              )}
            </div>

            <div className={isLast ? "flex-1" : "flex-1 pb-4"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      "text-sm font-medium",
                      step.enabled && !past
                        ? "text-neutral-900"
                        : "text-neutral-400",
                    ].join(" ")}
                  >
                    {TEMPLATE_LABELS[step.template]}
                  </p>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={-30}
                        max={60}
                        value={step.offsetDays}
                        onChange={(e) =>
                          handleOffsetChange(index, e.target.value)
                        }
                        disabled={!step.enabled}
                        className="w-14 h-6 text-xs border border-neutral-200 rounded px-1.5 text-center tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Offset days"
                      />
                      <span className="text-xs text-neutral-500">
                        {step.offsetDays < 0 ? "days before" : "days after"} due
                      </span>
                    </div>

                    {dateLabel && !past && step.enabled && (
                      <span className="text-xs font-medium text-primary-600">
                        {dateLabel}
                      </span>
                    )}

                    {past && step.enabled && (
                      <span className="text-xs text-neutral-400 italic">
                        in the past — will be skipped
                      </span>
                    )}
                  </div>

                  {step.enabled && (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleChannel(index, "EMAIL")}
                        className={[
                          "px-2 py-0.5 rounded text-xs font-medium border transition-colors",
                          step.channels.includes("EMAIL")
                            ? "bg-primary-50 border-primary-200 text-primary-700"
                            : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300",
                        ].join(" ")}
                      >
                        Email
                      </button>
                      {hasPhone && (
                        <button
                          type="button"
                          onClick={() => toggleChannel(index, "WHATSAPP")}
                          className={[
                            "px-2 py-0.5 rounded text-xs font-medium border transition-colors",
                            step.channels.includes("WHATSAPP")
                              ? "bg-success-50 border-success-200 text-success-700"
                              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300",
                          ].join(" ")}
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <label className="flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={(e) =>
                        updateStep(index, { enabled: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <div
                      className={[
                        "w-8 h-4 rounded-full transition-colors",
                        step.enabled ? "bg-primary-500" : "bg-neutral-200",
                      ].join(" ")}
                    />
                    <div
                      className={[
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform",
                        step.enabled ? "translate-x-4" : "translate-x-0.5",
                      ].join(" ")}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
