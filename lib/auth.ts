import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { canAccessAdmin } from "@/lib/roles";
import type { AppRole, User } from "@prisma/client";

export type AuthUser = User & { appRole: AppRole };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { appRole: true },
  });
  return user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!canAccessAdmin(user.appRole)) redirect("/isler");
  return user;
}

export async function requireCanManageUsers(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.appRole.canManageUsers) return user;
  if (user.appRole.canManageRoles) redirect("/admin/roles");
  redirect("/isler");
}

export async function requireCanManageRoles(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.appRole.canManageRoles) return user;
  if (user.appRole.canManageUsers) redirect("/admin/users");
  redirect("/isler");
}

export async function getBoardRole(userId: string, boardId: string) {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return membership?.role ?? null;
}

export async function requireBoardMember(userId: string, boardId: string) {
  const role = await getBoardRole(userId, boardId);
  if (!role) redirect("/isler");
  return role;
}

export async function requireCanCreateProjects(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.appRole.canCreateProjects) return user;
  redirect("/boards");
}

export async function getDefaultRole() {
  const fallback = await prisma.appRole.findFirst({
    where: { isDefault: true },
  });
  if (fallback) return fallback;
  return prisma.appRole.findFirst({
    where: { canManageUsers: false, canManageRoles: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function countUsersWhoCanManageUsers(excludeUserId?: string) {
  return prisma.user.count({
    where: {
      appRole: { canManageUsers: true },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}
