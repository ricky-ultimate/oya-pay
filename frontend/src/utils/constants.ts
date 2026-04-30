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
