"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBoardMember } from "@/lib/auth";

async function requireCanManageMembers(userId: string, boardId: string) {
  const role = await requireBoardMember(userId, boardId);
  if (role === "MEMBER") redirect(`/boards/${boardId}`);
  return role;
}

export async function addMemberAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const targetUserId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "MEMBER") as "ADMIN" | "MEMBER";

  if (!boardId || !targetUserId) return;
  await requireCanManageMembers(user.id, boardId);

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId, userId: targetUserId } },
    update: { role },
    create: { boardId, userId: targetUserId, role },
  });

  revalidatePath(`/boards/${boardId}/members`);
  redirect(`/boards/${boardId}/members`);
}

export async function changeMemberRoleAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "MEMBER") as "ADMIN" | "MEMBER";
  if (!boardId || !userId) return;

  await requireCanManageMembers(user.id, boardId);

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!membership || membership.role === "OWNER") return;

  await prisma.boardMember.update({
    where: { boardId_userId: { boardId, userId } },
    data: { role },
  });

  revalidatePath(`/boards/${boardId}/members`);
}

export async function removeMemberAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const userId = String(formData.get("userId") || "");
  if (!boardId || !userId) return;

  await requireCanManageMembers(user.id, boardId);

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!membership || membership.role === "OWNER") return;

  await prisma.boardMember.delete({ where: { boardId_userId: { boardId, userId } } });

  revalidatePath(`/boards/${boardId}/members`);
}
