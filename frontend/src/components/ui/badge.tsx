import type { InvoiceStatus } from "@/types";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  },
  PENDING: {
    label: "Pending",
    className: "bg-warning-50 text-warning-700 border border-warning-200",
  },
  PARTIAL: {
    label: "Partial",
    className: "bg-primary-50 text-primary-700 border border-primary-200",
  },
  PAID: {
    label: "Paid",
    className: "bg-success-50 text-success-700 border border-success-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-error-50 text-error-700 border border-error-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-400 border border-neutral-200",
  },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center justify-center h-5 min-w-[4.75rem] px-2 rounded-full text-xs font-semibold flex-shrink-0 ${config.className}`}
    >
      {config.label}
    </span>
  );
}
