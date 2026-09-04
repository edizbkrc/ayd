"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AssigneePicker, { type AssigneeRole, type AssigneeUser } from "./AssigneePicker";
import CustomSelect from "./CustomSelect";
import { PaperclipIcon, XIcon } from "./icons";

export type ProjectOption = { id: string; name: string };

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewTaskPanel({
  action,
  projects,
  users,
  roles,
  currentUserId,
  currentUserIsManager = false,
}: {
  action: (fd: FormData) => Promise<{ cardId: string; boardId: string } | { error: string }>;
  projects: ProjectOption[];
  users: AssigneeUser[];
  roles: AssigneeRole[];
  currentUserId: string;
  currentUserIsManager?: boolean;
}) {
  const [boardId, setBoardId] = useState(projects[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...Array.from(list).filter((f) => !names.has(f.name))].slice(0, 10);
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current || submitting) return;
    setSubmitting(true);

    const fd = new FormData(formRef.current);

    startTransition(async () => {
      try {
        const result = await action(fd);
        if ("error" in result) { setSubmitting(false); return; }

        const { cardId } = result;

        // Dosyaları yükle
        if (files.length > 0) {
          const ufd = new FormData();
          ufd.append("cardId", cardId);
          files.forEach((f) => ufd.append("files", f));
          await fetch("/api/upload", { method: "POST", body: ufd });
        }

        router.push("/isler?filtre=all");
        router.refresh();
      } catch {
        setSubmitting(false);
      }
    });
  }

  if (projects.length === 0) {
    return (
      <div className="empty-state card-surface">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Önce bir proje gerekir</p>
        <p className="text-xs mt-1.5 max-w-sm">Projeler sayfasından bir tane oluşturun.</p>
        <a href="/boards" className="btn mt-4">Projelere git</a>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col lg:flex-row gap-4"
    >

        {/* SOL / ANA ALAN */}
        <div className="flex-1 min-w-0 card-surface overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">

          {/* Başlık */}
          <div className="px-5 py-4">
            <input
              className="w-full text-xl font-bold bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-900 dark:text-white"
              name="title"
              required
              autoFocus
              placeholder="İşin adı..."
            />
          </div>

          {/* Yönetici notu */}
          {currentUserIsManager && (
            <div className="px-5 py-4">
              <label className="label mb-1.5 block" htmlFor="task-desc">
                Yönetici notu
                <span className="ml-1.5 text-[11px] font-normal text-faint">(isteğe bağlı)</span>
              </label>
              <textarea
                id="task-desc"
                name="description"
                rows={3}
                placeholder="İşle ilgili açıklama, beklentiler veya özel talimatlar..."
                className="input resize-none text-sm leading-relaxed w-full"
              />
            </div>
          )}

          {/* Proje + Tarih */}
          <div className="px-5 py-4 flex flex-wrap gap-4">
            <div style={{ width: "calc(33.333% - 8px)" }} className="min-w-[160px]">
              <p className="label mb-1.5">Proje</p>
              <CustomSelect
                name="boardId"
                value={boardId}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(v) => setBoardId(v)}
              />
            </div>
            <div style={{ width: "calc(33.333% - 8px)" }} className="min-w-[160px]">
              <p className="label mb-1.5">Bitiş tarihi</p>
              <input className="input" name="dueDate" type="date" />
            </div>
          </div>

          {/* Dosya ekleme */}
          <div className="px-5 py-4 space-y-3">
            <p className="label">Ek dosya / resim</p>
            <div
              className="group rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
              <div className="flex items-center gap-2 px-4 py-3 pointer-events-none">
                <PaperclipIcon className="h-4 w-4 text-slate-400 group-hover:text-brand-500 shrink-0" />
                <span className="text-sm text-muted">
                  Dosya seç{" "}
                  <span className="text-brand-600 dark:text-brand-400 font-medium">veya sürükle bırak</span>
                </span>
                <span className="ml-auto text-xs text-faint hidden sm:block">Resim, PDF, Word · 10 MB</span>
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
                    <button type="button" onClick={() => removeFile(i)} className="icon-btn h-6 w-6 shrink-0">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gönder */}
          <div className="px-5 py-4 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-3">
            <button type="submit" disabled={submitting} className="btn w-full sm:w-auto">
              {submitting
                ? "Oluşturuluyor…"
                : files.length > 0
                  ? `İşi oluştur + ${files.length} dosya yükle`
                  : "İşi oluştur"}
            </button>
            {files.length > 0 && (
              <span className="text-xs text-muted">{files.length} dosya seçildi</span>
            )}
          </div>
        </div>

        {/* SAĞ / KİM YAPACAK */}
        <div className="lg:w-72 xl:w-80 shrink-0 card-surface px-5 py-4">
          <p className="label mb-3">Kim yapacak</p>
          <AssigneePicker
            key={boardId}
            users={users}
            roles={roles}
            defaultSelectedIds={[currentUserId]}
            lockedIds={currentUserIsManager ? [currentUserId] : []}
          />
        </div>

    </form>
  );
}
