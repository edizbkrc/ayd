import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireBoardMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardPalette } from "@/lib/boardColors";
import { loadAssignablePeople } from "@/lib/assignees";
import { isDoneStage } from "@/lib/dates";
import Navbar from "@/components/Navbar";
import KanbanBoard from "@/components/KanbanBoard";
import { ChevronRightIcon, UsersIcon } from "@/components/icons";
import { createCardAction } from "./actions";

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const user = await requireUser();
  const role = await requireBoardMember(user.id, params.boardId);

  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    include: {
      _count: { select: { members: true } },
      lists: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: { assignees: { include: { user: true } } },
          },
        },
      },
    },
  });

  if (!board) notFound();

  const people = await loadAssignablePeople();
  const canManageBoard = role === "OWNER" || role === "ADMIN";
  const palette = boardPalette(board.id);

  const totalCards = board.lists.reduce((s, l) => s + l.cards.length, 0);
  const openCards = board.lists
    .filter((l) => !isDoneStage(l.name))
    .reduce((s, l) => s + l.cards.length, 0);
  const doneCards = totalCards - openCards;

  // REVIEW durumundaki kartlar — yöneticiye bildirim
  const reviewCards = board.lists.flatMap((l) =>
    l.cards
      .filter((c) => c.status === "REVIEW")
      .map((c) => ({
        id: c.id,
        title: c.title,
        listName: l.name,
        assignees: c.assignees.map((a) => a.user.name),
      }))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      {/* Renkli başlık bandı */}
      <div className={`${palette.header} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-6xl mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link href="/isler" className="hover:text-white transition-colors">İşlerim</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/boards" className="hover:text-white transition-colors">Projeler</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-white/80">{board.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{board.name}</h1>
              {board.description && (
                <p className="text-sm text-white/70 mt-1">{board.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {[
                  { label: "Açık iş", value: openCards },
                  { label: "Tamamlanan", value: doneCards },
                  { label: "Üye", value: board._count.members },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-bold text-white">{s.value}</span>
                    <span className="text-xs text-white/70">{s.label}</span>
                  </div>
                ))}
                {canManageBoard && reviewCards.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-400/30 backdrop-blur-sm rounded-full px-3 py-1 ring-1 ring-amber-300/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                    <span className="text-sm font-bold text-amber-100">{reviewCards.length}</span>
                    <span className="text-xs text-amber-200">onay bekliyor</span>
                  </div>
                )}
              </div>
            </div>

            {canManageBoard && (
              <Link
                href={`/boards/${board.id}/members`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white transition-colors shrink-0 ring-1 ring-white/20"
              >
                <UsersIcon className="h-4 w-4" />
                Ekibi yönet
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* İçerik alanı */}
      <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full space-y-4">

        {/* Yönetici bildirim paneli — onay bekleyenler */}
        {canManageBoard && reviewCards.length > 0 && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200 dark:ring-amber-800/60 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-amber-100 dark:border-amber-800/40">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Onay bekleyen işler
              </p>
              <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-medium">
                {reviewCards.length} iş incelemenizi bekliyor
              </span>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-800/30">
              {reviewCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/boards/${params.boardId}/cards/${card.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-100">
                      {card.title}
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                      {card.listName}
                      {card.assignees.length > 0 && ` · ${card.assignees.join(", ")}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-full">
                    İncele →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <KanbanBoard
          boardId={board.id}
          defaultListId={board.lists[0]?.id ?? ""}
          currentUserId={user.id}
          members={people.users}
          roles={people.roles}
          canManage={canManageBoard}
          createCardAction={createCardAction}
          cards={board.lists.flatMap((list) =>
            list.cards.map((card) => ({
              id: card.id,
              title: card.title,
              dueDate: card.dueDate ? card.dueDate.toISOString() : null,
              status: card.status,
              listId: list.id,
              assignees: card.assignees.map((a) => ({ id: a.user.id, name: a.user.name })),
            }))
          )}
        />
      </main>
    </div>
  );
}
