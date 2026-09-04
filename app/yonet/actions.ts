"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, getBoardRole } from "@/lib/auth";

export async function bulkDeleteCardsAction(formData: FormData) {
  const user = await requireUser();
  const ids = formData.getAll("cardIds").map(String).filter(Boolean);
  if (ids.length === 0) return;

  // Her kartın board'unda yönetici mi kontrol et
  const cards = await prisma.card.findMany({
    where: { id: { in: ids } },
    include: { list: { select: { boardId: true } } },
  });

  const boardIds = [...new Set(cards.map((c) => c.list.boardId))];
  for (const boardId of boardIds) {
    const role = await getBoardRole(user.id, boardId);
    if (role !== "OWNER" && role !== "ADMIN") redirect("/yonet");
  }

  await prisma.card.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/yonet");
  revalidatePath("/isler");
  revalidatePath("/boards");
}

export async function bulkDeleteBoardsAction(formData: FormData) {
  const user = await requireUser();
  if (!user.appRole.canCreateProjects && !user.appRole.canManageUsers) redirect("/yonet");

  const ids = formData.getAll("boardIds").map(String).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.board.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/yonet");
  revalidatePath("/boards");
}
