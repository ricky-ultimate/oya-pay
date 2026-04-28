import { InvoiceStatus } from "@/lib/api";

interface BadgeProps {
  status: InvoiceStatus;
}

const config: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  PENDING: { label: "Pending", className: "bg-warning-50 text-warning-700" },
  PARTIAL: { label: "Partial", className: "bg-[#F0FDFA] text-brand-teal" },
  PAID: { label: "Paid", className: "bg-success-50 text-success-700" },
  OVERDUE: { label: "Overdue", className: "bg-error-50 text-error-700" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-500",
  },
};

export function StatusBadge({ status }: BadgeProps) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
