"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { countUsersWhoCanManageUsers, getDefaultRole, hashPassword, requireCanManageUsers } from "@/lib/auth";

function redirectError(message: string, tab: "liste" | "yeni" = "liste") {
  const extra = tab === "yeni" ? "sekme=yeni&" : "";
  redirect(`/admin/users?${extra}error=` + encodeURIComponent(message));
}

export async function createUserAction(formData: FormData) {
  await requireCanManageUsers();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const roleId = String(formData.get("roleId") || "");

  if (!name || !email || !password) {
    redirectError("Tüm alanları doldurun.", "yeni");
  }
  if (password.length < 6) {
    redirectError("Şifre en az 6 karakter olmalı.", "yeni");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirectError("Bu e-posta zaten kayıtlı.", "yeni");
  }

  let assignedRoleId = roleId;
  if (assignedRoleId) {
    const role = await prisma.appRole.findUnique({ where: { id: assignedRoleId } });
    if (!role) {
      redirectError("Seçilen rol bulunamadı.", "yeni");
      return;
    }
  } else {
    const fallback = await getDefaultRole();
    if (!fallback) {
      redirectError("Atanacak bir rol yok. Önce bir rol oluşturun.", "yeni");
      return;
    }
    assignedRoleId = fallback.id;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, roleId: assignedRoleId },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function changeUserRoleAction(formData: FormData) {
  const admin = await requireCanManageUsers();
  const userId = String(formData.get("userId") || "");
  const roleId = String(formData.get("roleId") || "");
  if (!userId || !roleId) return;

  if (userId === admin.id) {
    redirectError("Kendi rolünüzü değiştiremezsiniz.");
  }

  const nextRole = await prisma.appRole.findUnique({ where: { id: roleId } });
  if (!nextRole) {
    redirectError("Seçilen rol bulunamadı.");
    return;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { appRole: true },
  });
  if (!target) return;

  if (target.appRole.canManageUsers && !nextRole.canManageUsers) {
    const remaining = await countUsersWhoCanManageUsers(userId);
    if (remaining === 0) {
      redirectError("En az bir kullanıcının kullanıcı yönetimi yetkisi olmalı.");
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { roleId } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireCanManageUsers();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  if (userId === admin.id) {
    redirectError("Kendi hesabınızı silemezsiniz.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { appRole: true },
  });
  if (!target) return;

  if (target.appRole.canManageUsers) {
    const remaining = await countUsersWhoCanManageUsers(userId);
    if (remaining === 0) {
      redirectError("Son yönetici kullanıcı silinemez.");
    }
  }

  const ownedBoardCount = await prisma.board.count({ where: { ownerId: userId } });
  if (ownedBoardCount > 0) {
    redirectError("Bu kullanıcı bazı projelerin sahibi olduğu için silinemiyor.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
}
