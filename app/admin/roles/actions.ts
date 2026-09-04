"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDefaultRole, requireCanManageRoles } from "@/lib/auth";
import { isValidRoleColor } from "@/lib/roles";

function redirectError(message: string, tab: "liste" | "yeni" = "liste") {
  const extra = tab === "yeni" ? "sekme=yeni&" : "";
  redirect(`/admin/roles?${extra}error=` + encodeURIComponent(message));
}

function parseRoleForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const colorRaw = String(formData.get("color") || "indigo");
  const color = isValidRoleColor(colorRaw) ? colorRaw : "indigo";
  const bool = (key: string) => formData.get(key) === "on";
  return {
    name, description, color,
    canManageUsers:    bool("canManageUsers"),
    canManageRoles:    bool("canManageRoles"),
    canCreateProjects: bool("canCreateProjects"),
    canCreateTasks:    bool("canCreateTasks"),
    canViewAllTasks:   bool("canViewAllTasks"),
    canManageMembers:  bool("canManageMembers"),
  };
}

export async function createRoleAction(formData: FormData) {
  await requireCanManageRoles();
  const parsed = parseRoleForm(formData);
  const { name, description, color } = parsed;

  if (!name) redirectError("Rol adı gerekli.", "yeni");

  const existing = await prisma.appRole.findUnique({ where: { name } });
  if (existing) redirectError("Bu isimde bir rol zaten var.", "yeni");

  await prisma.appRole.create({
    data: { name, description: description || null, color, ...parsed },
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  redirect("/admin/roles");
}

export async function updateRoleAction(formData: FormData) {
  await requireCanManageRoles();
  const roleId = String(formData.get("roleId") || "");
  const { name, description, color, canManageUsers, canManageRoles } = parseRoleForm(formData);
  if (!roleId || !name) redirectError("Rol adı gerekli.");

  const role = await prisma.appRole.findUnique({ where: { id: roleId } });
  if (!role) {
    redirectError("Rol bulunamadı.");
    return;
  }

  const duplicate = await prisma.appRole.findFirst({
    where: { name, id: { not: roleId } },
  });
  if (duplicate) redirectError("Bu isimde bir rol zaten var.");

  const parsed = parseRoleForm(formData);
  await prisma.appRole.update({
    where: { id: roleId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      color: parsed.color,
      canManageUsers:    role.isSystem ? role.canManageUsers    : parsed.canManageUsers,
      canManageRoles:    role.isSystem ? role.canManageRoles    : parsed.canManageRoles,
      canCreateProjects: role.isSystem ? role.canCreateProjects : parsed.canCreateProjects,
      canCreateTasks:    role.isSystem ? role.canCreateTasks    : parsed.canCreateTasks,
      canViewAllTasks:   role.isSystem ? role.canViewAllTasks   : parsed.canViewAllTasks,
      canManageMembers:  role.isSystem ? role.canManageMembers  : parsed.canManageMembers,
    },
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  redirect("/admin/roles");
}

export async function deleteRoleAction(formData: FormData) {
  await requireCanManageRoles();
  const roleId = String(formData.get("roleId") || "");
  if (!roleId) return;

  const role = await prisma.appRole.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) {
    redirectError("Rol bulunamadı.");
    return;
  }
  if (role.isSystem) {
    redirectError("Sistem rolleri silinemez.");
    return;
  }
  if (role.name === "Yönetici") {
    redirectError("Yönetici rolü silinemez.");
    return;
  }
  if (role.isDefault) {
    redirectError("Varsayılan rol silinemez.");
    return;
  }

  const fallback = await getDefaultRole();
  if (!fallback || fallback.id === roleId) {
    redirectError("Kullanıcıların aktarılacağı bir varsayılan rol yok.");
    return;
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { roleId },
      data: { roleId: fallback.id },
    }),
    prisma.appRole.delete({ where: { id: roleId } }),
  ]);

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  redirect("/admin/roles");
}
