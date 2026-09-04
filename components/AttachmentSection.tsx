"use client";

import { useState } from "react";
import AttachmentUploader from "./AttachmentUploader";
import { ChevronDownIcon } from "./icons";

type Att = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  userId: string;
};

type DeleteAction = (fd: FormData) => Promise<void>;
type NoteAction   = (fd: FormData) => Promise<void>;

/* ── Küçük dosya kartı ── */
function AttCard({ att, uploaderName, canDelete, cardId, boardId, deleteAction }: {
  att: Att;
  uploaderName?: string;
  canDelete?: boolean;
  cardId: string;
  boardId: string;
  deleteAction?: DeleteAction;
}) {
  const isImg = att.mimeType.startsWith("image/");
  return (
    <div className="group relative rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 text-sm">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.fileUrl} alt={att.fileName} className="w-full h-20 object-cover" />
      ) : (
        <div className="w-full h-20 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl">📄</span>
          <span className="text-[10px] font-semibold text-muted uppercase">{att.fileName.split(".").pop()}</span>
        </div>
      )}
      <div className="px-2 py-1.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{att.fileName}</p>
          {uploaderName && <p className="text-[10px] text-muted truncate">{uploaderName}</p>}
        </div>
        <a href={att.fileUrl} download={att.fileName} className="shrink-0 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">↓</a>
      </div>
      {canDelete && deleteAction && (
        <form action={deleteAction} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <input type="hidden" name="attachmentId" value={att.id} />
          <input type="hidden" name="cardId" value={cardId} />
          <input type="hidden" name="boardId" value={boardId} />
          <button type="submit" className="h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[10px] shadow">✕</button>
        </form>
      )}
    </div>
  );
}

/* ── Collapsible wrapper ── */
function Collapsible({ title, count, defaultOpen = false, children }: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <span className="section-label flex-1">{title}</span>
        {count > 0 && <span className="badge">{count}</span>}
        <ChevronDownIcon className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Ana export: Yönetici dosya bölümü ── */
export function ManagerAttachmentSection({ cardId, boardId, managerAtts, deleteAction }: {
  cardId: string;
  boardId: string;
  managerAtts: Att[];
  deleteAction: DeleteAction;
}) {
  return (
    <Collapsible title="📎 Yönetici Dosyaları" count={managerAtts.length} defaultOpen={managerAtts.length > 0}>
      {managerAtts.length === 0 && (
        <p className="text-sm text-faint">Henüz dosya eklenmedi.</p>
      )}
      {managerAtts.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {managerAtts.map((att) => (
            <AttCard key={att.id} att={att} canDelete cardId={cardId} boardId={boardId} deleteAction={deleteAction} />
          ))}
        </div>
      )}
      <AttachmentUploader cardId={cardId} />
    </Collapsible>
  );
}

/* ── Yönetici: üye teslim dosyaları ── */
export function MemberAttachmentViewSection({ cardId, boardId, memberAtts, userMap, deleteAction }: {
  cardId: string;
  boardId: string;
  memberAtts: Att[];
  userMap: Record<string, string>;
  deleteAction: DeleteAction;
}) {
  return (
    <Collapsible title="📤 Üye Teslim Dosyaları" count={memberAtts.length} defaultOpen={memberAtts.length > 0}>
      {memberAtts.length === 0 ? (
        <p className="text-sm text-faint">Üye henüz dosya yüklemedi.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {memberAtts.map((att) => (
            <AttCard key={att.id} att={att} uploaderName={userMap[att.userId]} canDelete cardId={cardId} boardId={boardId} deleteAction={deleteAction} />
          ))}
        </div>
      )}
    </Collapsible>
  );
}

/* ── Üye: kendi teslim dosyaları + not + yükleme ── */
export function MemberUploadSection({ cardId, boardId, myAtts, noteAction }: {
  cardId: string;
  boardId: string;
  myAtts: Att[];
  noteAction: NoteAction;
}) {
  return (
    <Collapsible title="📤 Teslim Dosyalarım" count={myAtts.length} defaultOpen>
      {myAtts.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {myAtts.map((att) => (
            <AttCard key={att.id} att={att} cardId={cardId} boardId={boardId} />
          ))}
        </div>
      )}
      <form action={noteAction} className="space-y-2">
        <input type="hidden" name="cardId" value={cardId} />
        <input type="hidden" name="boardId" value={boardId} />
        <textarea name="body" rows={2} placeholder="Yöneticiye not bırak (isteğe bağlı)..." className="input text-sm resize-none w-full" />
        <button type="submit" className="btn-secondary text-sm">Not Gönder</button>
      </form>
      <AttachmentUploader cardId={cardId} />
    </Collapsible>
  );
}
