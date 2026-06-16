"use client";

import type { FollowUpStepConfig } from "@/types";
import { computeScheduledDate, isInPast } from "@/utils/invoice";
import {
  FOLLOWUP_PRESETS,
  FOLLOWUP_OFFSET_OPTIONS,
  followUpOffsetLabel,
} from "@/utils/constants";
import { IconWhatsApp } from "@/components/ui/icons";

const TEMPLATE_LABELS: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

const TEMPLATE_HELP: Record<string, string> = {
  PRE_DUE_REMINDER: "A friendly nudge sent before the invoice is due.",
  FIRST_OVERDUE: "Sent as soon as the invoice becomes overdue.",
  SECOND_OVERDUE: "A firmer follow-up if payment still has not arrived.",
  FINAL_NOTICE:
    "The last automated reminder before you may want to step in personally.",
};

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

  const applyPreset = (presetId: string) => {
    const preset = FOLLOWUP_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange(
      steps.map((step) => ({
        ...step,
        enabled: true,
        offsetDays: preset.offsets[step.template],
      })),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-neutral-700 mb-2">
          Quick schedules
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FOLLOWUP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="text-left px-3 py-2.5 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
            >
              <p className="text-sm font-semibold text-neutral-900">
                {preset.label}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

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
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {TEMPLATE_HELP[step.template]}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <select
                        value={step.offsetDays}
                        onChange={(e) =>
                          updateStep(index, {
                            offsetDays: parseInt(e.target.value, 10),
                          })
                        }
                        disabled={!step.enabled}
                        className="h-7 text-xs border border-neutral-200 rounded-lg px-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="When to send"
                      >
                        {FOLLOWUP_OFFSET_OPTIONS.map((offset) => (
                          <option key={offset} value={offset}>
                            {followUpOffsetLabel(offset)}
                          </option>
                        ))}
                      </select>

                      {past && step.enabled && (
                        <span className="text-xs text-neutral-400 italic">
                          in the past, will be skipped
                        </span>
                      )}
                      {dateLabel && !past && step.enabled && (
                        <span className="text-xs font-medium text-primary-600">
                          {dateLabel}
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
                            <IconWhatsApp className="w-3 h-3" />
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
    </div>
  );
}
