"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";
import CustomSelect from "./CustomSelect";
import { SearchIcon } from "./icons";

type Candidate = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  roleColor: string;
};

export default function AddMemberForm({
  action,
  boardId,
  candidates,
}: {
  action: (formData: FormData) => void | Promise<void>;
  boardId: string;
  candidates: Candidate[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardRole, setBoardRole] = useState("MEMBER");

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.roleName.toLowerCase().includes(query.toLowerCase())
  );

  const selected = candidates.find((c) => c.id === selectedId);

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        Sisteme kayıtlı tüm kullanıcılar zaten bu projeye eklenmiş.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="userId" value={selectedId ?? ""} />
      <input type="hidden" name="role" value={boardRole} />

      {/* Arama */}
      <div className="relative">
        <SearchIcon className="h-4 w-4 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, e-posta veya rol ara..."
          className="input pl-9 text-sm"
        />
      </div>

      {/* Kullanıcı listesi */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {filtered.length === 0 && (
          <p className="text-sm text-faint text-center py-4">Eşleşen kullanıcı bulunamadı</p>
        )}
        {filtered.map((c) => {
          const active = selectedId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(active ? null : c.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all ring-1 ${
                active
                  ? "bg-brand-50 ring-brand-300 dark:bg-brand-950/40 dark:ring-brand-700"
                  : "bg-white ring-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-800/60"
              }`}
            >
              <Avatar name={c.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {c.name}
                  </span>
                  <RoleBadge name={c.roleName} color={c.roleColor} />
                </div>
                <p className="text-xs text-muted truncate">{c.email}</p>
              </div>
              {active && (
                <span className="h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Proje rolü + ekle butonu — sadece biri seçiliyse */}
      {selected && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <p className="label mb-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.name}</span>
              {" "}için proje rolü
            </p>
            <CustomSelect
              value={boardRole}
              onChange={setBoardRole}
              options={[
                { value: "MEMBER", label: "Üye" },
                { value: "ADMIN", label: "Yönetici" },
              ]}
            />
          </div>
          <button type="submit" className="btn shrink-0">
            Ekibe ekle
          </button>
        </div>
      )}
    </form>
  );
}
