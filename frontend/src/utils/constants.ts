import type { InvoiceType } from "@/types";

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

export interface FollowUpPreset {
  id: string;
  label: string;
  description: string;
  offsets: {
    PRE_DUE_REMINDER: number;
    FIRST_OVERDUE: number;
    SECOND_OVERDUE: number;
    FINAL_NOTICE: number;
  };
}

export const FOLLOWUP_PRESETS: FollowUpPreset[] = [
  {
    id: "gentle",
    label: "Gentle",
    description: "2-3 spaced-out reminders over 26 days",
    offsets: {
      PRE_DUE_REMINDER: -5,
      FIRST_OVERDUE: 3,
      SECOND_OVERDUE: 10,
      FINAL_NOTICE: 21,
    },
  },
  {
    id: "standard",
    label: "Standard",
    description: "Balanced reminders over 17 days",
    offsets: {
      PRE_DUE_REMINDER: -3,
      FIRST_OVERDUE: 1,
      SECOND_OVERDUE: 7,
      FINAL_NOTICE: 14,
    },
  },
  {
    id: "aggressive",
    label: "Aggressive",
    description: "Frequent reminders over 8 days for fast collection",
    offsets: {
      PRE_DUE_REMINDER: -1,
      FIRST_OVERDUE: 1,
      SECOND_OVERDUE: 3,
      FINAL_NOTICE: 7,
    },
  },
];

export const FOLLOWUP_OFFSET_OPTIONS: number[] = [
  -30, -21, -14, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 45,
  60,
];

export function followUpOffsetLabel(days: number): string {
  if (days === 0) return "On the due date";
  if (days < 0) {
    const n = Math.abs(days);
    return `${n} day${n !== 1 ? "s" : ""} before due date`;
  }
  return `${days} day${days !== 1 ? "s" : ""} after due date`;
}
