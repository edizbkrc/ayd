"use client";

import { useState, useEffect } from "react";
import type { AppRole } from "@prisma/client";
import RoleCard from "./RoleCard";
import RoleForm from "./RoleForm";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import ViewToggle from "./ViewToggle";
import { roleDotClass } from "@/lib/roles";
import { UsersIcon, PencilIcon, XIcon } from "./icons";
import { updateRoleAction, deleteRoleAction } from "@/app/admin/roles/actions";

type RoleWithCount = AppRole & { _count: { users: number } };

export default function AdminRoleList({ roles }: { roles: RoleWithCount[] }) {
  const [view, setView] = useState<"card" | "list">("card");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin-roles-view") as "card" | "list" | null;
    if (saved) setView(saved);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted">{roles.length} rol</p>
        <ViewToggle storageKey="admin-roles-view" onChange={setView} />
      </div>

      {view === "card" ? (
        <div className="grid gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              userCount={role._count.users}
              updateAction={updateRoleAction}
              deleteAction={deleteRoleAction}
            />
          ))}
        </div>
      ) : (
        <div className="card-surface overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {roles.map((role) => (
            <div key={role.id}>
              {/* Satır */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                {/* Rol adı */}
                <div className="flex items-center gap-2 w-40 shrink-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${roleDotClass(role.color)}`} />
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-100">{role.name}</span>
                  {role.isSystem && <span className="badge-outline text-[10px]">Sistem</span>}
                  {role.isDefault && <span className="badge text-[10px]">Varsayılan</span>}
                </div>

                {/* Açıklama */}
                <p className="flex-1 text-xs text-muted truncate hidden sm:block">
                  {role.description || "—"}
                </p>

                {/* Üye sayısı */}
                <span className="inline-flex items-center gap-1 text-xs text-muted shrink-0 w-16">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {role._count.users} kişi
                </span>

                {/* Yetkiler özet */}
                <div className="hidden md:flex flex-wrap gap-1 w-48 shrink-0">
                  {role.canManageUsers    && <span className="badge-brand text-[10px]">Kullanıcı yönetimi</span>}
                  {role.canManageRoles    && <span className="badge-brand text-[10px]">Rol yönetimi</span>}
                  {role.canCreateProjects && <span className="badge-brand text-[10px]">Proje oluşturma</span>}
                  {role.canManageMembers  && <span className="badge-brand text-[10px]">Üye yönetimi</span>}
                  {role.canViewAllTasks   && <span className="badge-brand text-[10px]">Tüm işleri görme</span>}
                  {role.canCreateTasks    && <span className="badge text-[10px]">İş oluşturma</span>}
                  {!role.canManageUsers && !role.canManageRoles && !role.canCreateProjects && !role.canViewAllTasks && !role.canCreateTasks && (
                    <span className="badge text-[10px]">Yalnızca atanan işler</span>
                  )}
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === role.id ? null : role.id)}
                    className="icon-btn"
                    title={editingId === role.id ? "Kapat" : "Düzenle"}
                  >
                    {editingId === role.id ? <XIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
                  </button>
                  {!role.isSystem && role.name !== "Yönetici" && (
                    <form action={deleteRoleAction}>
                      <input type="hidden" name="roleId" value={role.id} />
                      <ConfirmSubmitButton
                        confirmMessage={
                          role._count.users > 0
                            ? `"${role.name}" rolünü silmek istiyor musunuz? Bu roldeki ${role._count.users} kişi varsayılan role aktarılacak.`
                            : `"${role.name}" rolünü silmek istiyor musunuz?`
                        }
                        className="btn-danger btn-sm"
                      >
                        Sil
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </div>

              {/* Inline düzenleme formu */}
              {editingId === role.id && (
                <div className="px-4 py-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                  <RoleForm
                    action={async (fd) => { await updateRoleAction(fd); setEditingId(null); }}
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
