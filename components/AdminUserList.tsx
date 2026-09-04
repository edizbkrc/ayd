"use client";

import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";
import AssignRoleSelect from "./AssignRoleSelect";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import ViewToggle from "./ViewToggle";
import { changeUserRoleAction, deleteUserAction } from "@/app/admin/users/actions";

type Role = { id: string; name: string };
type User = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  appRole: { name: string; color: string };
  _count: { boardMembers: number; assignedCards: number };
};

export default function AdminUserList({
  users,
  roles,
  adminId,
}: {
  users: User[];
  roles: Role[];
  adminId: string;
}) {
  const [view, setView] = useState<"card" | "list">("card");

  useEffect(() => {
    const saved = localStorage.getItem("admin-users-view") as "card" | "list" | null;
    if (saved) setView(saved);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted">{users.length} kullanıcı</p>
        <ViewToggle storageKey="admin-users-view" onChange={setView} />
      </div>

      {view === "card" ? (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar name={u.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {u.name}
                      {u.id === adminId && <span className="text-xs text-faint font-normal"> (siz)</span>}
                    </p>
                    <RoleBadge name={u.appRole.name} color={u.appRole.color} />
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">{u.email}</p>
                  <p className="text-xs text-faint mt-1">
                    {u._count.boardMembers} proje · {u._count.assignedCards} görev
                  </p>
                </div>
              </div>
              {u.id === adminId ? (
                <p className="text-xs text-muted shrink-0">Kendi rolünüzü değiştiremezsiniz</p>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <AssignRoleSelect
                    action={changeUserRoleAction}
                    userId={u.id}
                    currentRoleId={u.roleId}
                    roles={roles}
                  />
                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`${u.name} (${u.email}) kullanıcısını silmek istediğinize emin misiniz?`}
                      className="btn-danger btn-sm"
                    >
                      Sil
                    </ConfirmSubmitButton>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Kullanıcı</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">E-posta</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">İstatistik</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="sm" />
                      <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                        {u.name}
                        {u.id === adminId && <span className="text-faint font-normal"> (siz)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <RoleBadge name={u.appRole.name} color={u.appRole.color} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-faint hidden md:table-cell">
                    {u._count.boardMembers} proje · {u._count.assignedCards} görev
                  </td>
                  <td className="px-4 py-2.5">
                    {u.id !== adminId && (
                      <div className="flex items-center gap-2 justify-end">
                        <AssignRoleSelect
                          action={changeUserRoleAction}
                          userId={u.id}
                          currentRoleId={u.roleId}
                          roles={roles}
                        />
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`${u.name} kullanıcısını silmek istediğinize emin misiniz?`}
                            className="btn-danger btn-sm"
                          >
                            Sil
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
