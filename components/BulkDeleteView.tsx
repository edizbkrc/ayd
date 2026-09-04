"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrashIcon } from "./icons";

type CardItem = {
  id: string; title: string; boardName: string;
  status: string; createdAt: Date;
};
type BoardItem = {
  id: string; name: string; cardCount: number; createdAt: Date;
};

const STATUS_TR: Record<string, string> = {
  TODO: "Yapılacak", IN_PROGRESS: "Devam ediyor",
  REVIEW: "İncelemede", DONE: "Tamamlandı", CANCELLED: "İptal",
};
const STATUS_COLOR: Record<string, string> = {
  TODO: "bg-slate-400", IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-amber-500", DONE: "bg-emerald-500", CANCELLED: "bg-red-400",
};

export default function BulkDeleteView({
  sekme, cards, boards, deleteCardsAction, deleteBoardsAction,
}: {
  sekme: "isler" | "projeler";
  cards: CardItem[];
  boards: BoardItem[];
  deleteCardsAction: (fd: FormData) => Promise<void>;
  deleteBoardsAction: (fd: FormData) => Promise<void>;
}) {
  const [tab, setTab] = useState<"isler" | "projeler">(sekme);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  const filteredCards = cards.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.boardName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCard = (id: string) => setSelectedCards((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleBoard = (id: string) => setSelectedBoards((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAllCards = () => {
    if (selectedCards.size === filteredCards.length) setSelectedCards(new Set());
    else setSelectedCards(new Set(filteredCards.map((c) => c.id)));
  };
  const toggleAllBoards = () => {
    if (selectedBoards.size === filteredBoards.length) setSelectedBoards(new Set());
    else setSelectedBoards(new Set(filteredBoards.map((b) => b.id)));
  };

  const selectedCount = tab === "isler" ? selectedCards.size : selectedBoards.size;

  function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    startTransition(async () => {
      const fd = new FormData();
      if (tab === "isler") {
        selectedCards.forEach((id) => fd.append("cardIds", id));
        await deleteCardsAction(fd);
        setSelectedCards(new Set());
      } else {
        selectedBoards.forEach((id) => fd.append("boardIds", id));
        await deleteBoardsAction(fd);
        setSelectedBoards(new Set());
      }
      setConfirm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Sekmeler */}
      <div className="flex items-center gap-2">
        {(["isler", "projeler"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSearch(""); setConfirm(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-muted ring-1 ring-slate-200 dark:ring-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t === "isler" ? `İşler (${cards.length})` : `Projeler (${boards.length})`}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={tab === "isler" ? "İş veya proje ara..." : "Proje ara..."}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setConfirm(false); }}
          className="input flex-1 min-w-[200px] max-w-sm"
        />

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            {confirm ? (
              <>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {selectedCount} öğe kalıcı silinecek, emin misiniz?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {isPending ? "Siliniyor…" : "Evet, sil"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800/60 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {selectedCount} öğeyi sil
              </button>
            )}
          </div>
        )}
      </div>

      {/* Liste */}
      {tab === "isler" ? (
        <div className="card-surface overflow-hidden">
          {filteredCards.length === 0 ? (
            <p className="text-sm text-muted text-center py-10">Sonuç bulunamadı.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedCards.size === filteredCards.length && filteredCards.length > 0}
                      onChange={toggleAllCards}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">İş</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Proje</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Durum</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedCards.has(card.id)
                        ? "bg-red-50/60 dark:bg-red-950/20"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => toggleCard(card.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{card.title}</td>
                    <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{card.boardName}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[card.status]}`} />
                        {STATUS_TR[card.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-faint hidden md:table-cell">
                      {new Date(card.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          {filteredBoards.length === 0 ? (
            <p className="text-sm text-muted text-center py-10">Sonuç bulunamadı.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedBoards.size === filteredBoards.length && filteredBoards.length > 0}
                      onChange={toggleAllBoards}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Proje</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">İş sayısı</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Oluşturulma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBoards.map((board) => (
                  <tr
                    key={board.id}
                    onClick={() => toggleBoard(board.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedBoards.has(board.id)
                        ? "bg-red-50/60 dark:bg-red-950/20"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedBoards.has(board.id)}
                        onChange={() => toggleBoard(board.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{board.name}</td>
                    <td className="px-4 py-2.5 text-muted">{board.cardCount} iş</td>
                    <td className="px-4 py-2.5 text-xs text-faint hidden md:table-cell">
                      {new Date(board.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <p className="text-xs text-muted text-center">
          {selectedCount} öğe seçildi — satıra tıklayarak seçimi değiştirebilirsiniz
        </p>
      )}
    </div>
  );
}
