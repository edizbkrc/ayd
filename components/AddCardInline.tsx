"use client";

import { useRef, useState, useTransition } from "react";
import { PlusIcon, XIcon } from "./icons";
import AssigneePicker, { type AssigneeRole, type AssigneeUser } from "./AssigneePicker";

export default function AddCardInline({
  action,
  boardId,
  listId,
  users,
  roles,
  currentUserId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  boardId: string;
  listId: string;
  users: AssigneeUser[];
  roles: AssigneeRole[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submitRef = useRef<HTMLButtonElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 hover:bg-white/70 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Görev ekle
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          setOpen(false);
        });
      }}
      className="space-y-1.5"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="listId" value={listId} />
      <textarea
        name="title"
        required
        autoFocus
        rows={2}
        placeholder="Görev nedir?"
        className="input text-sm resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitRef.current?.click();
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <input name="dueDate" type="date" className="input text-xs py-1.5" title="Bitiş tarihi" />
      <div>
        <p className="label mb-1">Kim yapsın</p>
        <AssigneePicker users={users} roles={roles} defaultSelectedIds={[currentUserId]} compact />
      </div>
      <div className="flex items-center gap-2">
        <button ref={submitRef} type="submit" disabled={isPending} className="btn btn-sm">
          {isPending ? "Ekleniyor..." : "Oluştur"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="icon-btn h-7 w-7" title="Vazgeç">
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
