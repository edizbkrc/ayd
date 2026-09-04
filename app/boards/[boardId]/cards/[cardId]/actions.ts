"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBoardMember, getBoardRole } from "@/lib/auth";
import { resolveAssignees } from "@/lib/assignees";
import { notifyAssigned, notifyApproved, notifyRejected, notifyReopened, notifyReview } from "@/lib/email";
import type { CardStatus } from "@prisma/client";

function isAllowedTransition(from: CardStatus, to: CardStatus, isManager: boolean): boolean {
  if (from === "DONE") return isManager;
  if (to === "DONE") return isManager;
  if (from === "REVIEW" && to === "IN_PROGRESS") return isManager;
  if (to === "CANCELLED") return isManager;

  const normalTransitions: Record<string, string[]> = {
    TODO: ["IN_PROGRESS"],
    IN_PROGRESS: ["REVIEW"],
    REVIEW: ["DONE", "IN_PROGRESS"],
    CANCELLED: [],
  };
  return normalTransitions[from]?.includes(to) ?? false;
}

export async function updateCardAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const cardId = String(formData.get("cardId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = String(formData.get("dueDate") || "");

  if (!boardId || !cardId || !title) return;
  const updateRole = await getBoardRole(user.id, boardId);
  if (updateRole !== "OWNER" && updateRole !== "ADMIN") throw new Error("Sadece yönetici düzenleyebilir");

  const assigneeIds = await resolveAssignees(boardId, formData);

  // Önceki atananları transaction'dan ÖNCE yakala
  const prevAssignees = await prisma.cardAssignee.findMany({ where: { cardId }, select: { userId: true } });
  const prevIds = new Set(prevAssignees.map((a) => a.userId));

  const cardData = await prisma.card.findUnique({ where: { id: cardId }, select: { title: true } });

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    }),
    prisma.cardAssignee.deleteMany({ where: { cardId } }),
    ...(assigneeIds.length
      ? [
          prisma.cardAssignee.createMany({
            data: assigneeIds.map((userId) => ({ cardId, userId })),
          }),
        ]
      : []),
  ]);

  // Yeni eklenen atananlara bildirim + aktivite kaydı
  const newlyAdded = assigneeIds.filter((id) => !prevIds.has(id) && id !== user.id);
  if (newlyAdded.length > 0 && cardData) {
    await prisma.cardActivity.create({
      data: { cardId, userId: user.id, action: "assigned" },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: newlyAdded } },
      select: { id: true, name: true, email: true },
    });
    for (const u of users) {
      await notifyAssigned({ toEmail: u.email, toUserId: u.id, toName: u.name, cardTitle: cardData.title, boardId, cardId, managerName: user.name });
    }
  }

  revalidatePath(`/boards/${boardId}`);
  revalidatePath(`/boards/${boardId}/cards/${cardId}`);
  revalidatePath("/isler");
  // redirect kaldırıldı — ManagerCardForm kendi router.refresh() yapıyor
}

export async function deleteCardAction(formData: FormData) {
  const user = await requireUser();
  const boardId = String(formData.get("boardId") || "");
  const cardId = String(formData.get("cardId") || "");
  if (!boardId || !cardId) return;

  const boardRole = await getBoardRole(user.id, boardId);
  const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
  if (!isManager) redirect(`/boards/${boardId}/cards/${cardId}`);

  await prisma.card.delete({ where: { id: cardId } });

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
  redirect(`/boards/${boardId}`);
}

export async function updateCardStatusAction(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("cardId") || "");
  const boardId = String(formData.get("boardId") || "");
  const newStatus = String(formData.get("status") || "") as CardStatus;
  const note = String(formData.get("note") || "").trim();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { assignees: true },
  });
  if (!card) return;

  const boardRole = await getBoardRole(user.id, boardId);
  if (!boardRole) redirect("/isler");

  const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
  const isAssignee = card.assignees.some((a) => a.userId === user.id);

  if (!isManager && !isAssignee) redirect(`/boards/${boardId}/cards/${cardId}`);

  const oldStatus = card.status;
  const allowed = isAllowedTransition(oldStatus, newStatus, isManager);
  if (!allowed) redirect(`/boards/${boardId}/cards/${cardId}`);

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: { status: newStatus } }),
    prisma.cardActivity.create({
      data: {
        cardId,
        userId: user.id,
        action: "status_changed",
        fromValue: oldStatus,
        toValue: newStatus,
        note: note || null,
      },
    }),
  ]);

  // E-posta bildirimleri (arka planda, hata olsa da devam et)
  const actorName = user.name;
  const boardId_ = boardId;
  const cardId_ = cardId;

  // Kartı ve atanmış kişileri çek
  const cardWithAssignees = await prisma.card.findUnique({
    where: { id: cardId_ },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
      list: { include: { board: { include: { members: { where: { role: { in: ["OWNER", "ADMIN"] } }, include: { user: { select: { id: true, name: true, email: true } } } } } } } },
    },
  });

  if (cardWithAssignees) {
    const assignees = cardWithAssignees.assignees.map((a) => a.user);
    const managers = cardWithAssignees.list.board.members.map((m) => m.user);

    // Üye → REVIEW: yöneticilere bildir
    if (newStatus === "REVIEW") {
      for (const mgr of managers) {
        if (mgr.id !== user.id) {
          await notifyReview({ toEmail: mgr.email, toUserId: mgr.id, toName: mgr.name, cardTitle: cardWithAssignees.title, boardId: boardId_, cardId: cardId_, memberName: actorName });
        }
      }
    }
    // Yönetici → DONE: atananlara bildir
    if (newStatus === "DONE") {
      for (const a of assignees) {
        await notifyApproved({ toEmail: a.email, toUserId: a.id, toName: a.name, cardTitle: cardWithAssignees.title, boardId: boardId_, cardId: cardId_, managerName: actorName });
      }
    }
    // Yönetici → IN_PROGRESS from REVIEW: geri gönderildi
    if (newStatus === "IN_PROGRESS" && oldStatus === "REVIEW") {
      for (const a of assignees) {
        await notifyRejected({ toEmail: a.email, toUserId: a.id, toName: a.name, cardTitle: cardWithAssignees.title, boardId: boardId_, cardId: cardId_, managerName: actorName, note: note || undefined });
      }
    }
    // Yönetici → IN_PROGRESS from DONE/CANCELLED: yeniden açıldı
    if (newStatus === "IN_PROGRESS" && (oldStatus === "DONE" || oldStatus === "CANCELLED")) {
      for (const a of assignees) {
        await notifyReopened({ toEmail: a.email, toUserId: a.id, toName: a.name, cardTitle: cardWithAssignees.title, boardId: boardId_, cardId: cardId_, managerName: actorName });
      }
    }
  }

  revalidatePath(`/boards/${boardId}/cards/${cardId}`);
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/isler");
  redirect(`/boards/${boardId}/cards/${cardId}`);
}

export async function deleteAttachmentAction(formData: FormData) {
  const user = await requireUser();
  const attachmentId = String(formData.get("attachmentId") || "");
  const boardId = String(formData.get("boardId") || "");
  const cardId = String(formData.get("cardId") || "");

  const boardRole = await getBoardRole(user.id, boardId);
  const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
  if (!isManager) throw new Error("Yetkiniz yok");

  const att = await prisma.cardAttachment.findUnique({ where: { id: attachmentId } });
  if (!att || att.cardId !== cardId) return;

  await prisma.cardAttachment.delete({ where: { id: attachmentId } });

  // R2'den sil
  try {
    const { deleteFromR2, urlToKey } = await import("@/lib/r2");
    await deleteFromR2(urlToKey(att.fileUrl));
  } catch {}

  revalidatePath(`/boards/${boardId}/cards/${cardId}`);
}

export async function addMemberNoteAction(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("cardId") || "");
  const boardId = String(formData.get("boardId") || "");
  const body = String(formData.get("body") || "").trim();

  if (!body) return;

  const boardRole = await getBoardRole(user.id, boardId);
  if (!boardRole) return;

  // DONE kartına üye not ekleyemez
  const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
  if (!isManager) {
    const card = await prisma.card.findUnique({ where: { id: cardId }, select: { status: true } });
    if (card?.status === "DONE") return;
  }

  await prisma.cardComment.create({ data: { cardId, userId: user.id, body } });
  await prisma.cardActivity.create({
    data: { cardId, userId: user.id, action: "commented", note: body },
  });

  revalidatePath(`/boards/${boardId}/cards/${cardId}`);
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("cardId") || "");
  const boardId = String(formData.get("boardId") || "");
  const body = String(formData.get("body") || "").trim();

  if (!body) return;

  const boardRole = await getBoardRole(user.id, boardId);
  if (!boardRole) return;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
  });
  if (!card) return;

  await prisma.$transaction([
    prisma.cardComment.create({ data: { cardId, userId: user.id, body } }),
    prisma.cardActivity.create({
      data: { cardId, userId: user.id, action: "commented", note: body },
    }),
  ]);

  revalidatePath(`/boards/${boardId}/cards/${cardId}`);
}
