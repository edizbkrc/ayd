"use client";

import { useRef, useState, useTransition } from "react";
import { PlusIcon, XIcon } from "./icons";

export default function AddListTile({
  action,
  boardId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  boardId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 ring-1 ring-slate-200/80 dark:ring-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white hover:text-brand-600 dark:hover:bg-slate-900 dark:hover:text-brand-400 transition-all shrink-0"
      >
        <PlusIcon className="h-4 w-4" />
        Aşama ekle
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          formRef.current?.reset();
          setOpen(false);
        });
      }}
      className="flex items-center gap-2 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input
        type="text"
        name="name"
        required
        autoFocus
        placeholder="Aşama adı..."
        className="input text-sm py-2 w-44"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <button type="submit" disabled={isPending} className="btn btn-sm shrink-0">
        {isPending ? "..." : "Ekle"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="icon-btn h-8 w-8 shrink-0">
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
