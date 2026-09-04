import Link from "next/link";
import { PlusIcon } from "./icons";

export type SectionTab = {
  href: string;
  label: string;
  count?: number;
  create?: boolean;
  active?: boolean;
};

export default function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const normalTabs = tabs.filter((t) => !t.create);
  const createTab = tabs.find((t) => t.create);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      {/* Normal sekmeler */}
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white/70 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-800">
        {normalTabs.map((tab) => {
          const active = Boolean(tab.active);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={`text-[11px] rounded-full px-1.5 font-medium ${
                    active
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Oluşturma butonu */}
      {createTab && (
        <Link
          href={createTab.href}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            createTab.active
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/30 hover:bg-brand-500"
              : "bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-brand-950/50 dark:hover:text-brand-300 dark:hover:ring-brand-800"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md ${
              createTab.active
                ? "bg-white/20"
                : "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400"
            }`}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </span>
          {createTab.label}
        </Link>
      )}
    </div>
  );
}
