"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "./icons";

export default function NewBoardTile({ action }: { action: (formData: FormData) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300/90 bg-white/40 text-slate-500 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 transition-all dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm group-hover:ring-brand-200 dark:bg-slate-800 dark:ring-slate-700">
          <PlusIcon className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold">Yeni proje</span>
      </button>
    );
  }

  return (
    <div className="card-surface p-5 min-h-[220px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Yeni proje</h3>
        <button type="button" onClick={() => setOpen(false)} className="icon-btn h-7 w-7" title="Kapat">
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <form action={action} className="space-y-3">
        <div>
          <label className="label" htmlFor="name">
            Proje adı
          </label>
          <input className="input" id="name" name="name" required placeholder="ör. Pazarlama" autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Açıklama (opsiyonel)
          </label>
          <input className="input" id="description" name="description" placeholder="Kısa açıklama" />
        </div>
        <button type="submit" className="btn w-full">
          Proje oluştur
        </button>
      </form>
    </div>
  );
}
