import type { InvoiceType, ProjectStatus } from "@/types";

export const TEMPLATE_LABELS: Record<string, string> = {
  INVOICE_SENT: "Invoice sent",
  PRE_DUE_REMINDER: "Pre-due reminder",
  FIRST_OVERDUE: "First overdue notice",
  SECOND_OVERDUE: "Second overdue notice",
  FINAL_NOTICE: "Final notice",
};

export const TEMPLATE_LABELS_SHORT: Record<string, string> = {
  INVOICE_SENT: "Sent",
  PRE_DUE_REMINDER: "Pre-due",
  FIRST_OVERDUE: "1st overdue",
  SECOND_OVERDUE: "2nd overdue",
  FINAL_NOTICE: "Final",
};

export const TEMPLATE_LABELS_BEST: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due reminder",
  FIRST_OVERDUE: "First overdue notice",
  SECOND_OVERDUE: "Second overdue notice",
  FINAL_NOTICE: "Final notice",
};

export const NEEDS_ATTENTION_REASON_LABELS: Record<string, string> = {
  no_sequence: "No reminders active",
  failed_send: "Last send failed",
  sequence_paused: "Sequence paused",
};

export const INVOICE_TYPE_CONFIG: Record<
  InvoiceType,
  { label: string; className: string } | null
> = {
  DEPOSIT: {
    label: "Deposit",
    className: "bg-warning-50 text-warning-700 border border-warning-200",
  },
  MILESTONE: {
    label: "Milestone",
    className: "bg-primary-50 text-primary-700 border border-primary-200",
  },
  FINAL: {
    label: "Final",
    className: "bg-success-50 text-success-700 border border-success-200",
  },
  STANDARD: null,
};

export const INVOICE_TYPE_ORDER: Record<InvoiceType, number> = {
  DEPOSIT: 0,
  MILESTONE: 1,
  FINAL: 2,
  STANDARD: 3,
};

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-success-50 text-success-700 border border-success-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-primary-50 text-primary-700 border border-primary-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  },
};
