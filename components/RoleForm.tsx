"use client";

import { useState } from "react";
import { ROLE_COLORS, roleSwatchClass } from "@/lib/roles";

type PermKey = "canManageUsers" | "canManageRoles" | "canCreateProjects" | "canCreateTasks" | "canViewAllTasks" | "canManageMembers";

const PERMISSIONS: { key: PermKey; label: string; desc: string }[] = [
  { key: "canManageUsers",    label: "Kullanıcı yönetimi",  desc: "Kullanıcı ekleyebilir, silebilir ve rol atayabilir." },
  { key: "canManageRoles",    label: "Rol yönetimi",        desc: "Yeni rol oluşturabilir, düzenleyebilir ve silebilir." },
  { key: "canCreateProjects", label: "Proje oluşturma",     desc: "Yeni proje (pano) oluşturabilir." },
  { key: "canManageMembers",  label: "Üye yönetimi",        desc: "Projeye üye ekleyebilir ve çıkarabilir." },
  { key: "canViewAllTasks",   label: "Tüm işleri görme",    desc: "Kendine atanmayan işleri de görebilir." },
  { key: "canCreateTasks",    label: "İş oluşturma",        desc: "Yeni iş (kart) oluşturabilir." },
];

export default function RoleForm({
  action,
  submitLabel,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: {
    id?: string;
    name: string;
    description: string;
    color: string;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canCreateProjects?: boolean;
    canCreateTasks?: boolean;
    canViewAllTasks?: boolean;
    canManageMembers?: boolean;
    lockPermissions?: boolean;
  };
}) {
  const [color, setColor] = useState(initial?.color ?? "indigo");
  const lockPermissions = initial?.lockPermissions ?? false;

  const defaultChecked: Record<PermKey, boolean> = {
    canManageUsers:    initial?.canManageUsers    ?? false,
    canManageRoles:    initial?.canManageRoles    ?? false,
    canCreateProjects: initial?.canCreateProjects ?? false,
    canCreateTasks:    initial?.canCreateTasks    ?? true,
    canViewAllTasks:   initial?.canViewAllTasks   ?? false,
    canManageMembers:  initial?.canManageMembers  ?? false,
  };

  return (
    <form action={action} className="space-y-4">
      {initial?.id && <input type="hidden" name="roleId" value={initial.id} />}
      <input type="hidden" name="color" value={color} />

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor={`role-name-${initial?.id ?? "new"}`}>
            Rol adı
          </label>
          <input
            className="input"
            id={`role-name-${initial?.id ?? "new"}`}
            name="name"
            required
            maxLength={40}
            defaultValue={initial?.name}
            placeholder="ör. Müdür"
          />
        </div>
        <div>
          <label className="label">Renk</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {ROLE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setColor(c.id)}
                className={`h-7 w-7 rounded-full ${roleSwatchClass(c.id)} ${
                  color === c.id ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900" : "ring-1 ring-black/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`role-desc-${initial?.id ?? "new"}`}>
          Açıklama
        </label>
        <input
          className="input"
          id={`role-desc-${initial?.id ?? "new"}`}
          name="description"
          defaultValue={initial?.description}
          placeholder="Bu rol ne işe yarar?"
        />
      </div>

      {lockPermissions ? (
        <>
          {PERMISSIONS.map((p) => (
            <input key={p.key} type="hidden" name={p.key} value={defaultChecked[p.key] ? "on" : ""} />
          ))}
          <p className="text-xs text-muted">Sistem rolünün yetkileri değiştirilemez.</p>
        </>
      ) : (
        <div className="space-y-1 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70 dark:bg-slate-800/40 dark:ring-slate-800">
          <p className="label mb-3">Yetkiler</p>
          {PERMISSIONS.map((p) => (
            <label key={p.key} className="flex items-start gap-2.5 text-sm cursor-pointer rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                name={p.key}
                defaultChecked={defaultChecked[p.key]}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{p.label}</span>
                <span className="block text-xs text-muted">{p.desc}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      <button type="submit" className="btn">
        {submitLabel}
      </button>
    </form>
  );
}
