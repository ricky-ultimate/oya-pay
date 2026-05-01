import type { ReliabilityScore } from "@/types";

const CONFIG: Record<ReliabilityScore, { label: string; className: string }> = {
  on_time: {
    label: "Pays on time",
    className: "bg-success-50 text-success-700 border border-success-200",
  },
  sometimes_late: {
    label: "Sometimes late",
    className: "bg-warning-50 text-warning-700 border border-warning-200",
  },
  consistently_late: {
    label: "Often late",
    className: "bg-error-50 text-error-700 border border-error-200",
  },
  no_data: {
    label: "No history",
    className: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  },
};

export function ReliabilityBadge({
  score,
  className = "",
}: {
  score: ReliabilityScore;
  className?: string;
}) {
  const config = CONFIG[score];
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
