"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BellIcon, XIcon } from "./icons";

type NotifItem = {
  id: string;
  message: string;
  cardId: string;
  boardId: string;
  boardName: string;
  action: string;
  toValue: string | null;
  fromValue?: string | null;
  createdAt: string;
};

type Toast = NotifItem & { toastId: string; exiting: boolean };

const TOAST_DURATION = 6000;
const POLL_INTERVAL = 5000;

function notifTone(action: string, toValue: string | null) {
  if (action === "status_changed" && toValue === "DONE") return "bg-slate-200 dark:bg-slate-700";
  return "bg-slate-100 dark:bg-slate-800";
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  return `${Math.floor(diff / 3600)} sa önce`;
}

function storageKey(userId: string, suffix: string) {
  return `notif_${userId}_${suffix}`;
}

function loadHistory(userId: string): NotifItem[] {
  try { return JSON.parse(localStorage.getItem(storageKey(userId, "history")) ?? "[]"); } catch { return []; }
}
function saveHistory(userId: string, items: NotifItem[]) {
  try { localStorage.setItem(storageKey(userId, "history"), JSON.stringify(items.slice(0, 50))); } catch { /* ignore */ }
}
function loadSeenIds(userId: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey(userId, "seen")) ?? "[]")); } catch { return new Set(); }
}
function saveSeenIds(userId: string, ids: Set<string>) {
  try { localStorage.setItem(storageKey(userId, "seen"), JSON.stringify([...ids].slice(-500))); } catch { /* ignore */ }
}
/** Son 24 saati döner (ilk yüklemede geçmiş aktiviteleri almak için) */
function since24h(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const [history, setHistory] = useState<NotifItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { setMounted(true); }, []);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  // polling için since: her başarılı poll'dan sonra "şu an" olarak güncellenir
  const sinceRef = useRef<string>(new Date().toISOString());
  const seenIds = useRef(new Set<string>());
  const initialLoadDone = useRef(false);

  // localStorage'dan yükle + ilk yüklemede son 24 saati çek (client-only)
  useEffect(() => {
    const stored = loadHistory(userId);
    const seen = loadSeenIds(userId);
    setHistory(stored);
    seenIds.current = seen;

    // İlk yüklemede son 24 saatin bildirimlerini çek (localStorage'da yoksa göster)
    async function initialLoad() {
      try {
        const res = await fetch(`/api/notifications?since=${encodeURIComponent(since24h())}`);
        if (!res.ok) return;
        const data: NotifItem[] = await res.json();
        // Sadece daha önce gösterilmemiş olanları ekle (toast göstermeden)
        let hasNew = false;
        setHistory((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const fresh = data.filter((n) => !existingIds.has(n.id));
          if (fresh.length === 0) return prev;
          hasNew = true;
          // seenIds'e ekle (toast çıkmasın diye)
          fresh.forEach((n) => { seenIds.current.add(n.id); });
          saveSeenIds(userId, seenIds.current);
          const next = [...fresh, ...prev].slice(0, 50);
          saveHistory(userId, next);
          return next;
        });
        if (hasNew) setUnread((u) => u + data.filter((n) => !seenIds.current.has(n.id)).length);
      } catch { /* sessizce geç */ }
      initialLoadDone.current = true;
    }
    initialLoad();
  }, []);

  // Tostu kapat
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.map((t) => t.toastId === toastId ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.toastId !== toastId)), 350);
  }, []);

  // Yeni bildirim ekle
  const addNotif = useCallback((n: NotifItem) => {
    setHistory((prev) => {
      const next = [n, ...prev].slice(0, 50);
      saveHistory(userId, next);
      return next;
    });
    setUnread((u) => u + 1);
    // Toast
    const toastId = `${n.id}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-4), { ...n, toastId, exiting: false }]);
    setTimeout(() => dismissToast(toastId), TOAST_DURATION);
    // Eğer kullanıcı şu an bu kartın sayfasındaysa sayfayı yenile (butonlar güncellensin)
    const cardPath = `/boards/${n.boardId}/cards/${n.cardId}`;
    if (pathname === cardPath || pathname?.startsWith(cardPath)) {
      router.refresh();
    }
  }, [dismissToast, router, pathname]);

  // Polling
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`/api/notifications?since=${encodeURIComponent(sinceRef.current)}`);
        if (res.ok) {
          const data: NotifItem[] = await res.json();
          sinceRef.current = new Date().toISOString();
          for (const n of data) {
            if (!seenIds.current.has(n.id)) {
              seenIds.current.add(n.id);
              saveSeenIds(userId, seenIds.current);
              addNotif(n);
            }
          }
        }
      } catch { /* sessizce geç */ }
      timer = setTimeout(poll, POLL_INTERVAL);
    }
    timer = setTimeout(poll, POLL_INTERVAL);
    return () => clearTimeout(timer);
  }, [addNotif]);

  // Panel dışı tıklama kapatma
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function openPanel() {
    setOpen((o) => !o);
    setUnread(0);
  }

  return (
    <>
      {/* Bell icon — navbar'da */}
      <div ref={panelRef} className="relative">
        <button
          type="button"
          onClick={openPanel}
          className={`relative icon-btn h-9 w-9 transition-colors !text-white/60 hover:!text-white hover:!bg-white/10 ${open ? "!bg-white/20 !text-white" : ""}`}
          title="Bildirimler"
        >
          <BellIcon className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none animate-bounce">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xl overflow-hidden z-50">
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Bildirimler</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn h-6 w-6 text-slate-400"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Liste */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <BellIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-muted">Henüz bildirim yok</p>
                  <p className="text-xs text-faint mt-1">İşlerde ilerleme olunca burada görürsünüz</p>
                </div>
              ) : (
                history.map((n) => {
                  return (
                    <Link
                      key={n.id}
                      href={`/boards/${n.boardId}/cards/${n.cardId}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className={`h-8 w-8 rounded-xl ${notifTone(n.action, n.toValue)} flex items-center justify-center shrink-0 mt-0.5 text-slate-500 dark:text-slate-400`}>
                        <BellIcon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted mb-0.5">{n.boardName}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-faint mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {history.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    saveHistory(userId, []);
                  }}
                  className="text-xs text-muted hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Tümünü temizle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast'lar — createPortal ile body'ye render edilir, navbar context'inden etkilenmez */}
      {mounted && toasts.length > 0 && createPortal(
        <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 99999, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none" }}>
          {toasts.map((toast) => {
            return (
              <div
                key={toast.toastId}
                style={{ pointerEvents: "auto", width: "320px", opacity: toast.exiting ? 0 : 1, transform: toast.exiting ? "translateY(8px) scale(0.95)" : "translateY(0) scale(1)", transition: "opacity 300ms, transform 300ms" }}
                className="rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200/80 dark:ring-slate-700 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3.5">
                  <span className={`h-8 w-8 rounded-xl ${notifTone(toast.action, toast.toValue)} flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400`}>
                    <BellIcon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted font-medium mb-0.5">{toast.boardName}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{toast.message}</p>
                    <Link
                      href={`/boards/${toast.boardId}/cards/${toast.cardId}`}
                      className="inline-block mt-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      onClick={() => dismissToast(toast.toastId)}
                    >
                      İşe git →
                    </Link>
                  </div>
                  <button type="button" onClick={() => dismissToast(toast.toastId)} className="icon-btn h-6 w-6 shrink-0 text-slate-400">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-slate-400/50 dark:bg-slate-500/50" style={{ animation: `shrink-progress ${TOAST_DURATION}ms linear forwards` }} />
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
