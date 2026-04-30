export const TEMPLATE_LABELS: Record<string, string> = {
  INVOICE_SENT: "Invoice Sent",
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

export const TEMPLATE_LABELS_SHORT: Record<string, string> = {
  INVOICE_SENT: "Invoice Sent",
  PRE_DUE_REMINDER: "Pre-due",
  FIRST_OVERDUE: "1st Overdue",
  SECOND_OVERDUE: "2nd Overdue",
  FINAL_NOTICE: "Final Notice",
};

export const TEMPLATE_LABELS_BEST: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

export const NEEDS_ATTENTION_REASON_LABELS: Record<string, string> = {
  no_sequence: "No reminders active",
  failed_send: "Last send failed",
  sequence_paused: "Sequence paused",
};
