"use client";

import { useRef, useState } from "react";
import { PaperclipIcon, XIcon } from "./icons";

type Props = {
  cardId: string;
  onUploaded?: () => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentUploader({ cardId, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !names.has(f.name))].slice(0, 10);
    });
    setDone(false);
  }

  function remove(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function upload() {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("cardId", cardId);
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        setFiles([]);
        setDone(true);
        onUploaded?.();
        // Sayfayı yenile (Next.js router refresh)
        window.location.reload();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className="group relative rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer"
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
        <div className="flex items-center gap-2 px-4 py-3 pointer-events-none">
          <PaperclipIcon className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
          <p className="text-sm text-muted">
            Dosya ekle{" "}
            <span className="text-brand-600 dark:text-brand-400 font-medium">veya sürükle bırak</span>
          </p>
          <p className="ml-auto text-xs text-faint hidden sm:block">Resim, PDF, Word, Excel · 10 MB</p>
        </div>
      </div>

      {/* Seçilen dosyalar */}
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
              <button type="button" onClick={() => remove(i)} className="icon-btn h-6 w-6 shrink-0">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="btn-secondary text-sm w-full"
        >
          {uploading ? "Yükleniyor…" : `Yükle (${files.length} dosya)`}
        </button>
      )}

      {done && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">✓ Dosyalar yüklendi</p>
      )}
    </div>
  );
}
