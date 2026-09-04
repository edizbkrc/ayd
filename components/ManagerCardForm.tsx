"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PaperclipIcon, XIcon } from "./icons";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  cardId: string;
  boardId: string;
  defaultTitle: string;
  defaultDescription: string;
  saveAction: (fd: FormData) => Promise<void> | void;
};

export default function ManagerCardForm({
  cardId,
  boardId,
  defaultTitle,
  defaultDescription,
  saveAction,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...Array.from(list).filter((f) => !names.has(f.name))].slice(0, 10);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setDone(false);
    try {
      const fd = new FormData(formRef.current!);
      await saveAction(fd);

      if (files.length > 0) {
        const uploadFd = new FormData();
        uploadFd.append("cardId", cardId);
        files.forEach((f) => uploadFd.append("files", f));
        await fetch("/api/upload", { method: "POST", body: uploadFd });
        setFiles([]);
      }

      setDone(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} id="mgr-form" onSubmit={handleSubmit} className="card-surface overflow-hidden">
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="cardId" value={cardId} />

      {/* Başlık, Açıklama, Dosya, Buton */}
      <div>
        <div className="p-5 sm:p-7 space-y-5">
          <div>
            <label className="label" htmlFor="mgr-title">Başlık</label>
            <input
              className="input text-xl font-bold tracking-tight"
              id="mgr-title"
              name="title"
              defaultValue={defaultTitle}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="mgr-desc">Açıklama</label>
            <textarea
              className="input leading-relaxed min-h-[10rem] resize-y"
              id="mgr-desc"
              name="description"
              rows={6}
              defaultValue={defaultDescription}
              placeholder="Bu iş hakkında ne yapılması gerektiğini yazın..."
            />
          </div>
        </div>

        {/* Dosya ekleme */}
        <div className="px-5 sm:px-7 pb-5 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          <p className="label flex items-center gap-1.5">
            <PaperclipIcon className="h-3.5 w-3.5" /> Dosya ekle
          </p>
          <div
            className="group relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            <div className="flex items-center gap-2 px-4 py-3 pointer-events-none">
              <PaperclipIcon className="h-4 w-4 text-slate-400 group-hover:text-brand-500 shrink-0" />
              <p className="text-sm text-muted">Dosya seç <span className="text-brand-600 dark:text-brand-400 font-medium">veya sürükle bırak</span></p>
              <p className="ml-auto text-xs text-faint hidden sm:block">10 MB</p>
            </div>
          </div>
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((file, i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 px-3 py-2">
                  {file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(file)} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0">📄</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-[11px] text-muted">{formatSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="icon-btn h-6 w-6 shrink-0">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kaydet butonu */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 bg-slate-50/70 dark:bg-slate-950/40">
          <button type="submit" disabled={saving} className="btn">
            {saving ? "Gönderiliyor…" : files.length > 0 ? `Kaydet & ${files.length} Dosya Yükle` : "Değişiklikleri Kaydet"}
          </button>
          {done && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Kaydedildi</span>}
        </div>
      </div>
    </form>
  );
}
