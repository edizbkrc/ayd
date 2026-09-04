"use client";

import { useEffect, useState } from "react";

type View = "card" | "list";

export function useViewMode(key: string, defaultView: View = "card"): [View, (v: View) => void] {
  const [view, setView] = useState<View>(defaultView);

  useEffect(() => {
    const saved = localStorage.getItem(key) as View | null;
    if (saved === "card" || saved === "list") setView(saved);
  }, [key]);

  function change(v: View) {
    setView(v);
    localStorage.setItem(key, v);
  }

  return [view, change];
}

export default function ViewToggle({
  storageKey,
  onChange,
}: {
  storageKey: string;
  onChange: (v: View) => void;
}) {
  const [view, setView] = useState<View>("card");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as View | null;
    if (saved === "card" || saved === "list") {
      setView(saved);
      onChange(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle(v: View) {
    setView(v);
    localStorage.setItem(storageKey, v);
    onChange(v);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-900 p-0.5">
      <button
        type="button"
        onClick={() => toggle("card")}
        title="Kart görünümü"
        className={`p-1.5 rounded-lg transition-colors ${
          view === "card"
            ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => toggle("list")}
        title="Liste görünümü"
        className={`p-1.5 rounded-lg transition-colors ${
          view === "list"
            ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2" rx="1" />
          <rect x="1" y="7" width="14" height="2" rx="1" />
          <rect x="1" y="12" width="14" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
}
