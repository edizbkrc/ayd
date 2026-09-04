import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BulkDeleteView from "@/components/BulkDeleteView";
import { bulkDeleteCardsAction, bulkDeleteBoardsAction } from "./actions";

export default async function YonetPage({
  searchParams,
}: {
  searchParams: { sekme?: string };
}) {
  const user = await requireUser();
  const isManager = user.appRole.canManageUsers || user.appRole.canManageRoles || user.appRole.canCreateProjects;
  if (!isManager) redirect("/dashboard");

  const sekme = searchParams.sekme === "projeler" ? "projeler" : "isler";

  // Yöneticinin eriştiği board'lar
  const memberships = await prisma.boardMember.findMany({
    where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
    include: { board: { include: { lists: { include: { _count: { select: { cards: true } } } } } } },
  });

  const boards = memberships.map((m) => ({
    id: m.board.id,
    name: m.board.name,
    cardCount: m.board.lists.reduce((s, l) => s + l._count.cards, 0),
    createdAt: m.board.createdAt,
  }));

  const boardIds = boards.map((b) => b.id);

  const cards = await prisma.card.findMany({
    where: { list: { boardId: { in: boardIds } } },
    include: { list: { include: { board: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const cardItems = cards.map((c) => ({
    id: c.id,
    title: c.title,
    boardName: c.list.board.name,
    status: c.status,
    createdAt: c.createdAt,
  }));

  return (
    <div className="min-h-screen page-bg">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Toplu Yönetim</h1>
          <p className="text-sm text-muted mt-1">İş veya projeleri seçip hızlıca silebilirsiniz.</p>
        </div>
        <BulkDeleteView
          sekme={sekme}
          cards={cardItems}
          boards={boards}
          deleteCardsAction={bulkDeleteCardsAction}
          deleteBoardsAction={bulkDeleteBoardsAction}
        />
      </main>
    </div>
  );
}
