export function computeScheduledDate(
  dueDate: string,
  offsetDays: number,
): string {
  const due = new Date(dueDate);
  const d = new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function isInPast(dueDate: string, offsetDays: number): boolean {
  const due = new Date(dueDate);
  return (
    new Date(due.getTime() + offsetDays * 24 * 60 * 60 * 1000) <= new Date()
  );
}
