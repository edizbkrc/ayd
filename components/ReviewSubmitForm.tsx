"use client";

import { useRef, useState, useTransition } from "react";
import { PaperclipIcon, XIcon } from "./icons";

type Props = {
  cardId: string;
  boardId: string;
  action: (fd: FormData) => Promise<void>;
};

export default function ReviewSubmitForm({ cardId, boardId, action }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !names.has(f.name))].slice(0, 10);
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImage(file: File) {
    return file.type.startsWith("image/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      // Önce dosyaları yükle
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("cardId", cardId);
        files.forEach((f) => fd.append("files", f));
        await fetch("/api/upload", { method: "POST", body: fd });
      }

      // Sonra status güncelle
      const fd = new FormData();
      fd.append("cardId", cardId);
      fd.append("boardId", boardId);
      fd.append("status", "REVIEW");
      startTransition(async () => {
        await action(fd);
      });
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || pending;

  return (
    <div className="space-y-3">
      {/* Dosya ekleme alanı */}
      <div
        className="group relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-1.5 py-5 px-4 text-center pointer-events-none">
          <PaperclipIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Dosya ekle <span className="text-brand-600 dark:text-brand-400">veya sürükle bırak</span>
          </p>
          <p className="text-xs text-muted">Resim, PDF, Word, Excel — maks. 10 MB</p>
        </div>
      </div>

      {/* Seçilen dosyalar */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 px-3 py-2">
              {isImage(file) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-8 w-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <span className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                  📄
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-[11px] text-muted">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="icon-btn h-6 w-6 text-slate-400 shrink-0"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="btn w-full text-sm"
      >
        {busy ? "Gönderiliyor…" : `↑ İncelemeye Gönder${files.length > 0 ? ` (${files.length} dosya ile)` : ""}`}
      </button>
    </div>
  );
}
