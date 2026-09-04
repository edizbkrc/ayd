"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AddCardInline from "./AddCardInline";
import AvatarStack from "./AvatarStack";
import { CalendarIcon, ChevronDownIcon, SearchIcon } from "./icons";
import { DUE_STYLE, dueLabel, dueStatus, type DueStatus } from "@/lib/dates";
import type { AssigneeRole, AssigneeUser } from "./AssigneePicker";

export type KanbanCard = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  listId: string;
  assignees: { id: string; name: string }[];
};

// 3 sabit grup — status'a göre
const GROUPS = [
  {
    key: "todo",
    label: "Yapılacak",
    statuses: ["TODO"],
    color: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400",
    countBg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  {
    key: "inprogress",
    label: "Devam ediyor",
    statuses: ["IN_PROGRESS", "REVIEW"],
    color: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-400",
    countBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  },
  {
    key: "done",
    label: "Onaylandı",
    statuses: ["DONE"],
    color: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
    countBg: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  },
] as const;

const STATUS_LABEL: Record<string, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  REVIEW: "İncelemede",
  DONE: "Onaylandı",
  CANCELLED: "İptal",
};

const STATUS_DOT: Record<string, string> = {
  TODO: "bg-slate-300 dark:bg-slate-600",
  IN_PROGRESS: "bg-blue-400",
  REVIEW: "bg-amber-400",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-400",
};

export default function KanbanBoard({
  boardId,
  defaultListId,
  cards,
  currentUserId,
  members,
  roles,
  canManage,
  createCardAction,
}: {
  boardId: string;
  defaultListId: string;
  cards: KanbanCard[];
  currentUserId: string;
  members: AssigneeUser[];
  roles: AssigneeRole[];
  canManage: boolean;
  createCardAction: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (card.status === "CANCELLED") return false; // iptal edilenleri gizle
      if (mineOnly && !card.assignees.some((a) => a.id === currentUserId)) return false;
      if (q && !card.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, query, mineOnly, currentUserId]);

  function toggle(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="h-4 w-4 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Görev ara..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl bg-white/70 dark:bg-slate-900/60 ring-1 ring-slate-200/80 dark:ring-slate-800 px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none hover:bg-white dark:hover:bg-slate-900 transition-colors shrink-0">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Sadece benim
        </label>
      </div>

      {/* 3 sabit grup */}
      {GROUPS.map((group) => {
        const groupCards = filtered.filter((c) =>
          (group.statuses as readonly string[]).includes(c.status)
        );
        const isCollapsed = !!collapsed[group.key];

        return (
          <div key={group.key} className="card-surface overflow-hidden">
            {/* Grup başlığı */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
              onClick={() => toggle(group.key)}
            >
              <div className="flex items-center gap-2.5">
                <ChevronDownIcon
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                />
                <span className={`h-2 w-2 rounded-full shrink-0 ${group.dot}`} />
                <h2 className={`text-sm font-bold ${group.color}`}>{group.label}</h2>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${group.countBg}`}>
                  {groupCards.length}
                </span>
              </div>
            </div>

            {/* Kartlar */}
            {!isCollapsed && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                {groupCards.length === 0 && (
                  <p className="text-xs text-faint text-center py-5">
                    {query || mineOnly ? "Eşleşen görev yok" : "Bu grupta iş yok"}
                  </p>
                )}

                {groupCards.length > 0 && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {groupCards.map((card) => {
                      const due = dueStatus(card.dueDate);
                      const label = dueLabel(due, card.dueDate);
                      const mine = card.assignees.some((a) => a.id === currentUserId);

                      return (
                        <Link
                          key={card.id}
                          href={`/boards/${boardId}/cards/${card.id}`}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                            mine ? "border-l-2 border-brand-400" : ""
                          }`}
                        >
                          {/* Durum noktası */}
                          <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[card.status] ?? "bg-slate-300"}`} />

                          {/* Başlık */}
                          <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                            {card.title}
                          </span>

                          {/* REVIEW badge */}
                          {card.status === "REVIEW" && (
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hidden sm:inline-flex">
                              İncelemede
                            </span>
                          )}

                          {/* Bitiş tarihi */}
                          {due !== "none" && label && (
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-flex ${DUE_STYLE[due as Exclude<DueStatus, "none">]}`}>
                              <CalendarIcon className="h-3 w-3" />
                              {label}
                            </span>
                          )}

                          {/* Atananlar */}
                          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                            <AvatarStack names={card.assignees.map((a) => a.name)} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Görev ekle — sadece Yapılacak grubunda */}
                {group.key === "todo" && (
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <AddCardInline
                      action={createCardAction}
                      boardId={boardId}
                      listId={defaultListId}
                      users={members}
                      roles={roles}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
