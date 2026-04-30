"use client";

import { ClientStats, FollowUpStepConfig } from "@/lib/api";

interface LatePayerBannerProps {
  clientName: string;
  stats: ClientStats;
  steps: FollowUpStepConfig[];
  onAdjust: (steps: FollowUpStepConfig[]) => void;
  onDismiss: () => void;
}

export function LatePayerBanner({
  clientName,
  stats,
  steps,
  onAdjust,
  onDismiss,
}: LatePayerBannerProps) {
  if (!stats.avgDaysLate || stats.avgDaysLate <= 7) return null;

  const shift = Math.min(stats.avgDaysLate, 14);

  const handleAdjust = () => {
    const adjusted = steps.map((s) => ({
      ...s,
      offsetDays: Math.max(s.offsetDays - shift, -30),
    }));
    onAdjust(adjusted);
    onDismiss();
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-warning-50 border border-warning-200">
      <svg
        className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-warning-800">
          {clientName} usually pays {stats.avgDaysLate} days late
        </p>
        <p className="text-xs text-warning-700 mt-0.5">
          Starting reminders {shift} days earlier may improve collection.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleAdjust}
            className="text-xs font-semibold text-warning-800 hover:text-warning-900 underline underline-offset-2"
          >
            Adjust sequence
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-warning-600 hover:text-warning-700"
          >
            Keep as is
          </button>
        </div>
      </div>
    </div>
  );
}
