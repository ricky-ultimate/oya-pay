import { IconCheck, IconWhatsApp, IconEmail } from "@/components/ui/icons";
import { computeScheduledDate, isInPast } from "@/utils/invoice";
import { TEMPLATE_LABELS } from "@/utils/constants";
import type { FollowUpStepConfig } from "@/types";

interface SendConfirmedViewProps {
  dueDate: string;
  confirmedSteps: FollowUpStepConfig[];
  title?: string;
  subtitle?: string;
}

export function SendConfirmedView({
  dueDate,
  confirmedSteps,
  title = "Invoice sent",
  subtitle = "Your collection agent is now active",
}: SendConfirmedViewProps) {
  const activeSteps = confirmedSteps.filter(
    (s) => s.enabled && !isInPast(dueDate, s.offsetDays),
  );

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center">
        <IconCheck className="w-6 h-6 text-success-600" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
      {activeSteps.length > 0 ? (
        <div className="w-full bg-neutral-50 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Scheduled follow-ups
          </p>
          {activeSteps.map((step) => (
            <div
              key={step.template}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-neutral-700">
                {TEMPLATE_LABELS[step.template]}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {step.channels.includes("WHATSAPP") && (
                    <IconWhatsApp className="w-3 h-3 text-brand-green" />
                  )}
                  {step.channels.includes("EMAIL") && (
                    <IconEmail className="w-3 h-3 text-primary-500" />
                  )}
                </div>
                <span className="text-xs font-medium text-primary-600 tabular-nums">
                  {computeScheduledDate(dueDate, step.offsetDays)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 text-center">
          No follow-ups were scheduled — all steps were in the past or disabled.
        </p>
      )}
    </div>
  );
}
