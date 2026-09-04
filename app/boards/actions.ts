"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCanCreateProjects, requireUser } from "@/lib/auth";

export async function bulkDeleteBoardsAction(formData: FormData) {
  const user = await requireUser();
  if (!user.appRole.canCreateProjects && !user.appRole.canManageUsers) return;
  const ids = formData.getAll("boardIds").map(String).filter(Boolean);
  if (ids.length === 0) return;
  await prisma.board.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/boards");
}

export async function createBoardAction(formData: FormData) {
  const user = await requireCanCreateProjects();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) return;

  const board = await prisma.board.create({
    data: {
      name,
      description: description || null,
      ownerId: user.id,
      members: {
        create: [{ userId: user.id, role: "OWNER" }],
      },
      lists: {
        create: [
          { name: "Yapılacak", order: 0 },
          { name: "Devam ediyor", order: 1 },
          { name: "Bitti", order: 2 },
        ],
      },
    },
  });

  revalidatePath("/boards");
  revalidatePath("/isler");
  redirect(`/boards/${board.id}`);
}
