"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import { CheckIcon } from "./icons";
import type { PickerRole, PickerUser } from "@/lib/assignee-types";

export type AssigneeUser = PickerUser;
export type AssigneeRole = PickerRole;

export default function AssigneePicker({
  users,
  roles,
  defaultSelectedIds = [],
  lockedIds = [],
  name = "assigneeIds",
  compact = false,
  form,
}: {
  users: AssigneeUser[];
  roles: AssigneeRole[];
  defaultSelectedIds?: string[];
  /** Bu ID'ler her zaman seçili kalır, toggle edilemez */
  lockedIds?: string[];
  name?: string;
  compact?: boolean;
  form?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set([...defaultSelectedIds, ...lockedIds]));

  function toggle(id: string) {
    if (lockedIds.includes(id)) return; // kilitli kullanıcı değiştirilemez
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRole(roleId: string) {
    const ids = users.filter((u) => u.roleId === roleId).map((u) => u.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = ids.length > 0 && ids.every((id) => next.has(id));
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  if (users.length === 0) {
    return <p className="text-xs text-faint">Atanacak kullanıcı yok.</p>;
  }

  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const grouped = roles
    .map((role) => ({
      role,
      members: users.filter((u) => u.roleId === role.id),
    }))
    .filter((g) => g.members.length > 0);

  const ungrouped = users.filter((u) => !roleMap.has(u.roleId));

  const renderRow = (user: AssigneeUser) => {
    const on = selected.has(user.id);
    const locked = lockedIds.includes(user.id);
    return (
      <button
        key={user.id}
        type="button"
        onClick={() => toggle(user.id)}
        disabled={locked}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
          locked
            ? "bg-slate-50 dark:bg-slate-800/30 cursor-default opacity-70"
            : on
            ? "bg-brand-50 dark:bg-brand-950/40"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
      >
        <Avatar name={user.name} size="sm" />
        <span className={`flex-1 text-sm font-medium truncate ${on ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-200"}`}>
          {user.name}
        </span>
        {locked ? (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">sabit</span>
        ) : (
          <span className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
            on ? "bg-brand-500 border-brand-500" : "border-slate-300 dark:border-slate-600"
          }`}>
            {on && <CheckIcon className="h-3 w-3 text-white" />}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs */}
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} form={form} />
      ))}

      {grouped.map(({ role, members }) => {
        const allSelected = members.every((m) => selected.has(m.id));
        return (
          <div key={role.id}>
            <button
              type="button"
              onClick={() => toggleRole(role.id)}
              className="flex items-center gap-2 px-3 py-1 w-full text-left"
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-${role.color}-500 shrink-0`} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {role.name}
              </span>
              <span className="text-xs text-slate-400">({members.length})</span>
              {allSelected && (
                <span className="ml-auto text-[10px] text-brand-500 font-medium">tümü seçili</span>
              )}
            </button>
            <div className="mt-0.5 space-y-0.5">
              {members.map(renderRow)}
            </div>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="space-y-0.5">
          {ungrouped.map(renderRow)}
        </div>
      )}

      {selected.size > 0 && (
        <p className="text-xs text-muted px-3 pt-1">{selected.size} kişi seçili</p>
      )}
    </div>
  );
}
