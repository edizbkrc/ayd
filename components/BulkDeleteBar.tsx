"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "./icons";

type Item = { id: string; label: string };

export default function BulkDeleteBar({
  items,
  deleteAction,
  fieldName,
}: {
  items: Item[];
  deleteAction: (fd: FormData) => Promise<void>;
  fieldName: string;
}) {
  const [active, setActive] = useState(false);
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
      selected.forEach((id) => fd.append(fieldName, id));
      await deleteAction(fd);
      setSelected(new Set());
      setConfirm(false);
      setActive(false);
      router.refresh();
    });
  }

  function cancel() {
    setActive(false);
    setSelected(new Set());
    setConfirm(false);
  }

  return (
    <>
      {/* Buton */}
      {!active ? (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ring-1 bg-white dark:bg-slate-800 text-muted ring-slate-200 dark:ring-slate-700 hover:text-red-600 dark:hover:text-red-400 hover:ring-red-200 dark:hover:ring-red-800/60 transition-colors"
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
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">{selected.size} silinecek?</span>
                <button type="button" onClick={handleDelete} disabled={isPending}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                  {isPending ? "Siliniyor…" : "Evet"}
                </button>
                <button type="button" onClick={() => setConfirm(false)}
                  className="px-2 py-1 rounded-lg text-xs text-muted hover:text-slate-700 dark:hover:text-slate-200">
                  Hayır
                </button>
              </>
            ) : (
              <button type="button" onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                <TrashIcon className="h-3.5 w-3.5" />
                Sil
              </button>
            )
          )}
          <button type="button" onClick={cancel}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            İptal
          </button>
        </div>
      )}

      {/* Aktif modda mevcut item'lar üzerine overlay liste */}
      {active && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Sağ alt panel */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-lg px-4">
            <div className="card-surface shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Silmek istediklerinizi seçin
                </p>
                <span className="text-xs text-muted">{selected.size} / {items.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected.has(item.id)
                        ? "bg-red-50 dark:bg-red-950/25"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selected.has(item.id)
                        ? "border-red-500 bg-red-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {selected.has(item.id) && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm truncate ${selected.has(item.id) ? "text-red-700 dark:text-red-300 font-medium" : "text-slate-700 dark:text-slate-200"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
