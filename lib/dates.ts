export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export type DueStatus = "overdue" | "today" | "soon" | "later" | "none";

export function dueStatus(dueDate: Date | string | null | undefined): DueStatus {
  if (!dueDate) return "none";
  const today = startOfDay();
  const due = startOfDay(new Date(dueDate));
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 2) return "soon";
  return "later";
}

export const DUE_STYLE: Record<Exclude<DueStatus, "none">, string> = {
  overdue: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  today: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  soon: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  later: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function formatDue(dueDate: Date | string) {
  return new Date(dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function dueLabel(status: DueStatus, dueDate?: Date | string | null) {
  if (status === "overdue") return "Gecikti";
  if (status === "today") return "Bugün";
  if (status === "soon" && dueDate) return formatDue(dueDate);
  if (dueDate) return formatDue(dueDate);
  return "";
}

export function isDoneStage(name: string) {
  return /tamamland|bitti|done|complete|kapat/i.test(name);
}
