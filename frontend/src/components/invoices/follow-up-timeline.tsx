"use client";

import { FollowUpStepConfig } from "@/lib/api";

const TEMPLATE_LABELS: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

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
  return (
    new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000) <= new Date()
  );
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
                      {hasPhone && (
                        <button
                          type="button"
                          onClick={() => toggleChannel(index, "WHATSAPP")}
                          className={[
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
                            step.channels.includes("WHATSAPP")
                              ? "bg-success-50 border-success-200 text-success-700"
                              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300",
                          ].join(" ")}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </button>
                      )}
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
