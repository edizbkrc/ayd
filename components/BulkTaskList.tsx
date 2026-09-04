"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import TaskRow, { type TaskItem } from "./TaskRow";
import { TrashIcon } from "./icons";

type Section = { key: string; title: string; items: TaskItem[] };

export default function BulkTaskList({
  sections,
  deleteAction,
  isManager,
}: {
  sections: Section[];
  deleteAction: (fd: FormData) => Promise<void>;
  isManager: boolean;
}) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (id: string) => {
    setConfirm(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    startTransition(async () => {
      const fd = new FormData();
      selected.forEach((id) => fd.append("cardIds", id));
      await deleteAction(fd);
      setSelected(new Set());
      setConfirm(false);
      setBulkMode(false);
      router.refresh();
    });
  }

  const visibleSections = sections.filter((s) => s.items.length > 0);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("isler-bulk-slot"));
  }, []);

  const toolbar = isManager ? (
    !bulkMode ? (
      <button
        type="button"
        onClick={() => setBulkMode(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ring-1 bg-white dark:bg-slate-800 text-muted ring-slate-200 dark:ring-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:ring-red-200 dark:hover:ring-red-800/60 transition-colors"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Toplu sil
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">{selected.size} seçildi</span>
        {selected.size > 0 && (
          confirm ? (
            <>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">{selected.size} iş silinecek?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                {isPending ? "Siliniyor…" : "Evet"}
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="px-2 py-1 rounded-lg text-xs text-muted hover:text-slate-700 dark:hover:text-slate-200">
                Hayır
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {selected.size} işi sil
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => { setBulkMode(false); setSelected(new Set()); setConfirm(false); }}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          İptal
        </button>
      </div>
    )
  ) : null;

  return (
    <div className="space-y-4">
      {slot && toolbar ? createPortal(toolbar, slot) : null}

      {visibleSections.map((section) => (
        <section key={section.key} className="card-surface overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{section.title}</h2>
            <span className="badge">{section.items.length}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {section.items.map((task) => (
              <div
                key={task.id}
                className={`relative ${bulkMode ? "pl-10" : ""}`}
              >
                <TaskRow task={task} />
                {bulkMode && (
                  <div
                    onClick={() => toggle(task.id)}
                    className="absolute inset-0 cursor-pointer flex items-center pl-4 transition-colors"
                    style={{
                      background: selected.has(task.id)
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(0,0,0,0)",
                    }}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected.has(task.id)
                          ? "border-red-500 bg-red-500"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {selected.has(task.id) && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
