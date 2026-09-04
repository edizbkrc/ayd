import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_TR: Record<string, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  REVIEW: "İncelemeye gönderildi",
  DONE: "Onaylandı",
  CANCELLED: "İptal edildi",
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 5000);

  // 1) Yönetici bildirimleri: yönetici olduğu board'lardaki REVIEW geçişleri
  const managedBoards = await prisma.boardMember.findMany({
    where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
    select: { boardId: true },
  });
  const managedBoardIds = managedBoards.map((b) => b.boardId);

  // 2) Atanan bildirimleri: kullanıcının atandığı kartlardaki yönetici işlemleri
  const assignedCards = await prisma.cardAssignee.findMany({
    where: { userId: user.id },
    select: { cardId: true },
  });
  const assignedCardIds = assignedCards.map((c) => c.cardId);

  // Her iki grubun aktivitelerini tek sorguda çek
  const activities = await prisma.cardActivity.findMany({
    where: {
      createdAt: { gt: since },
      userId: { not: user.id }, // kendi işlemlerini gösterme
      OR: [
        // Yönetici bildirimleri: yönetici olduğu board'larda REVIEW'a geçiş
        ...(managedBoardIds.length > 0 ? [{
          card: { list: { boardId: { in: managedBoardIds } } },
          OR: [
            { action: "status_changed", toValue: "REVIEW" },
            { action: "commented" },
          ],
        }] : []),
        // Atanan bildirimleri: atandığı kartlarda yönetici onay/red/yeniden açma + yeni atama
        ...(assignedCardIds.length > 0 ? [{
          cardId: { in: assignedCardIds },
          OR: [
            { action: "status_changed", toValue: "DONE" },
            { action: "status_changed", toValue: "IN_PROGRESS", fromValue: "REVIEW" },
            { action: "status_changed", toValue: "IN_PROGRESS", fromValue: "DONE" },
            { action: "status_changed", toValue: "IN_PROGRESS", fromValue: "CANCELLED" },
            { action: "commented" },
          ],
        }] : []),
        // Yeni atama bildirimi: kullanıcı herhangi bir karta yeni atandıysa
        {
          action: "assigned",
          userId: { not: user.id },
          card: {
            assignees: { some: { userId: user.id } },
          },
        },
      ],
    },
    include: {
      user: { select: { name: true } },
      card: {
        select: {
          id: true,
          title: true,
          list: { select: { board: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Tekrar eden ID'leri filtrele (OR koşullarından dolayı gelebilir)
  const seen = new Set<string>();
  const unique = activities.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const notifications = unique.map((a) => ({
    id: a.id,
    cardId: a.card.id,
    cardTitle: a.card.title,
    boardId: a.card.list.board.id,
    boardName: a.card.list.board.name,
    action: a.action,
    toValue: a.toValue,
    fromValue: a.fromValue,
    createdAt: a.createdAt.toISOString(),
    message: buildMessage(a, user.id, assignedCardIds),
  }));

  return Response.json(notifications);
}

function buildMessage(
  a: {
    action: string;
    toValue: string | null;
    fromValue: string | null;
    user: { name: string };
    card: { title: string };
    cardId: string;
  },
  currentUserId: string,
  assignedCardIds: string[],
): string {
  const actor = a.user.name.split(" ")[0];
  const card = a.card.title.length > 30 ? a.card.title.slice(0, 30) + "…" : a.card.title;
  const isAssignee = assignedCardIds.includes(a.cardId);

  if (a.action === "status_changed" && a.toValue === "REVIEW") {
    return `${actor} "${card}" işini incelemeye gönderdi`;
  }
  if (a.action === "status_changed" && a.toValue === "DONE") {
    return isAssignee
      ? `"${card}" işiniz onaylandı`
      : `${actor} "${card}" işini tamamladı`;
  }
  if (a.action === "status_changed" && a.toValue === "IN_PROGRESS" && a.fromValue === "REVIEW") {
    return isAssignee
      ? `"${card}" işiniz geri gönderildi, düzenleme gerekiyor`
      : `${actor} "${card}" işine geri döndü`;
  }
  if (a.action === "status_changed" && a.toValue === "IN_PROGRESS" && (a.fromValue === "DONE" || a.fromValue === "CANCELLED")) {
    return isAssignee
      ? `Yönetici "${card}" işini yeniden açtı`
      : `${actor} "${card}" işini yeniden açtı`;
  }
  if (a.action === "status_changed" && a.toValue) {
    return `${actor} "${card}" → ${STATUS_TR[a.toValue] ?? a.toValue}`;
  }
  if (a.action === "assigned") {
    return `Size "${card}" işi atandı`;
  }
  if (a.action === "commented") {
    return `${actor} "${card}" işine yorum yaptı`;
  }
  return `${actor}: ${card}`;
}
