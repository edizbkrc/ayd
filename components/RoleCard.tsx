"use client";

import { useState } from "react";
import type { AppRole } from "@prisma/client";
import RoleForm from "./RoleForm";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import { PencilIcon, XIcon, UsersIcon } from "./icons";
import { roleDotClass } from "@/lib/roles";

export default function RoleCard({
  role,
  userCount,
  updateAction,
  deleteAction,
}: {
  role: AppRole;
  userCount: number;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${roleDotClass(role.color)}`} />
            <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
            {role.isSystem && <span className="badge-outline">Sistem</span>}
            {role.isDefault && <span className="badge">Varsayılan</span>}
          </div>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            {role.description || "Açıklama eklenmemiş."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="icon-btn shrink-0"
          title={editing ? "Kapat" : "Düzenle"}
        >
          {editing ? <XIcon /> : <PencilIcon />}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
        <span className="inline-flex items-center gap-1 text-muted">
          <UsersIcon className="h-3.5 w-3.5" />
          {userCount} kişi
        </span>
        {role.canManageUsers    && <span className="badge-brand">Kullanıcı yönetimi</span>}
        {role.canManageRoles    && <span className="badge-brand">Rol yönetimi</span>}
        {role.canCreateProjects && <span className="badge-brand">Proje oluşturma</span>}
        {role.canManageMembers  && <span className="badge-brand">Üye yönetimi</span>}
        {role.canViewAllTasks   && <span className="badge-brand">Tüm işleri görme</span>}
        {role.canCreateTasks    && <span className="badge">İş oluşturma</span>}
        {!role.canManageUsers && !role.canManageRoles && !role.canCreateProjects && !role.canViewAllTasks && !role.canCreateTasks && (
          <span className="badge">Yalnızca atanan işler</span>
        )}
      </div>

      {editing && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <RoleForm
            action={updateAction}
            submitLabel="Kaydet"
            initial={{
              id: role.id,
              name: role.name,
              description: role.description ?? "",
              color: role.color,
              canManageUsers:    role.canManageUsers,
              canManageRoles:    role.canManageRoles,
              canCreateProjects: role.canCreateProjects,
              canCreateTasks:    role.canCreateTasks,
              canViewAllTasks:   role.canViewAllTasks,
              canManageMembers:  role.canManageMembers,
              lockPermissions:   role.isSystem,
            }}
          />
          {!role.isSystem && role.name !== "Yönetici" && (
            <form action={deleteAction}>
              <input type="hidden" name="roleId" value={role.id} />
              <ConfirmSubmitButton
                confirmMessage={
                  userCount > 0
                    ? `"${role.name}" rolünü silmek istiyor musunuz? Bu roldeki ${userCount} kişi varsayılan role aktarılacak.`
                    : `"${role.name}" rolünü silmek istiyor musunuz?`
                }
                className="btn-danger btn-sm"
              >
                Rolü sil
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
