"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBoardMember, getBoardRole } from "@/lib/auth";
import { resolveAssignees } from "@/lib/assignees";
import { notifyAssigned } from "@/lib/email";

export async function bulkDeleteCardsAction(formData: FormData) {
  const user = await requireUser();
  const ids = formData.getAll("cardIds").map(String).filter(Boolean);
  if (ids.length === 0) return;

  const cards = await prisma.card.findMany({
    where: { id: { in: ids } },
    include: { list: { select: { boardId: true } } },
  });
  const boardIds = [...new Set(cards.map((c) => c.list.boardId))];
  for (const boardId of boardIds) {
    const role = await getBoardRole(user.id, boardId);
    if (role !== "OWNER" && role !== "ADMIN") return;
  }
  await prisma.card.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/isler");
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("dueDate") || "");
  if (!boardId || !title) return;

  await requireBoardMember(user.id, boardId);

  const firstList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { order: "asc" },
  });
  if (!firstList) return;

  const assigneeIds = await resolveAssignees(boardId, formData);

  const maxOrder = await prisma.card.aggregate({
    where: { listId: firstList.id },
    _max: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      listId: firstList.id,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/isler");
  revalidatePath(`/boards/${boardId}`);
  redirect("/isler?filtre=all");
}

// Redirect etmeden ID döndürür — dosya yüklemeli oluşturma için
export async function createTaskAndReturnId(formData: FormData): Promise<{ cardId: string; boardId: string } | { error: string }> {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("dueDate") || "");
  const description = String(formData.get("description") || "").trim() || null;
  if (!boardId || !title) return { error: "Eksik alan" };

  await requireBoardMember(user.id, boardId);

  const firstList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { order: "asc" },
  });
  if (!firstList) return { error: "Liste bulunamadı" };

  const assigneeIds = await resolveAssignees(boardId, formData);

  const maxOrder = await prisma.card.aggregate({
    where: { listId: firstList.id },
    _max: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      listId: firstList.id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  // Aktivite kaydı + atanan kişilere bildirim
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

  revalidatePath("/isler");
  revalidatePath(`/boards/${boardId}`);
  return { cardId: card.id, boardId };
}
