import Link from "next/link";
import AvatarStack from "./AvatarStack";
import { CalendarIcon, FolderIcon } from "./icons";
import { DUE_STYLE, dueLabel, dueStatus, type DueStatus } from "@/lib/dates";

export type TaskItem = {
  id: string;
  title: string;
  dueDate: Date | string | null;
  boardId: string;
  boardName: string;
  listName: string;
  assigneeNames: string[];
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  REVIEW: "İncelemede",
  DONE: "Onaylandı",
  CANCELLED: "İptal",
};

const STATUS_STYLE: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  REVIEW: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  DONE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  CANCELLED: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
};

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-rose-400",
};

export default function TaskRow({ task }: { task: TaskItem }) {
  const due = dueStatus(task.dueDate);
  const label = dueLabel(due, task.dueDate);
  const cardStatus = task.status ?? "TODO";

  return (
    <Link
      href={`/boards/${task.boardId}/cards/${task.id}`}
      className="flex items-start sm:items-center gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
    >
      {/* Durum noktası */}
      <span className={`mt-1 sm:mt-0 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[cardStatus]}`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{task.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <FolderIcon className="h-3.5 w-3.5" />
            {task.boardName}
          </span>
          <span className="text-faint">·</span>
          <span>{task.listName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <AvatarStack names={task.assigneeNames} />

        {/* Durum badge */}
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[cardStatus]}`}>
          {STATUS_LABEL[cardStatus]}
        </span>

        {/* Tarih badge */}
        {due !== "none" && label && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${DUE_STYLE[due as Exclude<DueStatus, "none">]}`}>
            <CalendarIcon className="h-3 w-3" />
            {label}
          </span>
        )}
      </div>
    </Link>
  );
}
