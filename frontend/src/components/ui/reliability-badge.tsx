import { ClientStats } from "@/lib/api";

type Score = ClientStats["reliabilityScore"];

const CONFIG: Record<
  Score,
  { label: string; className: string; dotClass: string }
> = {
  on_time: {
    label: "Pays on time",
    className: "bg-success-50 text-success-700",
    dotClass: "bg-success-500",
  },
  sometimes_late: {
    label: "Sometimes late",
    className: "bg-warning-50 text-warning-700",
    dotClass: "bg-warning-500",
  },
  consistently_late: {
    label: "Consistently late",
    className: "bg-error-50 text-error-700",
    dotClass: "bg-error-500",
  },
  no_data: {
    label: "No payment history",
    className: "bg-neutral-100 text-neutral-500",
    dotClass: "bg-neutral-400",
  },
};

interface ReliabilityBadgeProps {
  score: Score;
  className?: string;
}

export function ReliabilityBadge({
  score,
  className = "",
}: ReliabilityBadgeProps) {
  const cfg = CONFIG[score];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClass}`}
      />
      {cfg.label}
    </span>
  );
}
