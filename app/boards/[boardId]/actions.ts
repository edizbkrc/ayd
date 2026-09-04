"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBoardMember } from "@/lib/auth";
import { resolveAssignees } from "@/lib/assignees";
import { notifyAssigned } from "@/lib/email";

export async function createListAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!boardId || !name) return;

  await requireBoardMember(user.id, boardId);

  const maxOrder = await prisma.list.aggregate({
    where: { boardId },
    _max: { order: true },
  });

  await prisma.list.create({
    data: {
      boardId,
      name,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
}

export async function createCardAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const listId = String(formData.get("listId") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("dueDate") || "");
  if (!boardId || !listId || !title) return;

  await requireBoardMember(user.id, boardId);

  const maxOrder = await prisma.card.aggregate({
    where: { listId },
    _max: { order: true },
  });

  const assigneeIds = await resolveAssignees(boardId, formData);

  const card = await prisma.card.create({
    data: {
      listId,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  if (assigneeIds.length > 0) {
    await prisma.cardActivity.create({
      data: { cardId: card.id, userId: user.id, action: "assigned" },
    });
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true },
    });
    for (const a of assignees) {
      if (a.id !== user.id) {
        await notifyAssigned({
          toEmail: a.email, toUserId: a.id, toName: a.name,
          cardTitle: title, boardId, cardId: card.id, managerName: user.name,
        });
      }
    }
  }

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
}

export async function moveCardAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const cardId = String(formData.get("cardId") || "");
  const targetListId = String(formData.get("targetListId") || "");
  if (!boardId || !cardId || !targetListId) return;

  await requireBoardMember(user.id, boardId);

  const maxOrder = await prisma.card.aggregate({
    where: { listId: targetListId },
    _max: { order: true },
  });

  await prisma.card.update({
    where: { id: cardId },
    data: {
      listId: targetListId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
}

export async function deleteListAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const listId = String(formData.get("listId") || "");
  if (!boardId || !listId) return;

  const role = await requireBoardMember(user.id, boardId);
  if (role === "MEMBER") redirect(`/boards/${boardId}`);

  await prisma.list.delete({ where: { id: listId } });
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
}
