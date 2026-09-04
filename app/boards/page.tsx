import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardPalette } from "@/lib/boardColors";
import Navbar from "@/components/Navbar";
import NewProjectPanel from "@/components/NewProjectPanel";
import SectionTabs from "@/components/SectionTabs";
import { LayoutIcon, InboxIcon } from "@/components/icons";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import { createBoardAction, bulkDeleteBoardsAction } from "./actions";

const ROLE_LABEL: Record<string, string> = { OWNER: "Sahip", ADMIN: "Yönetici", MEMBER: "Üye" };

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: { sekme?: string };
}) {
  const user = await requireUser();
  const isManager = user.appRole.canManageUsers || user.appRole.canManageRoles || user.appRole.canCreateProjects;
  if (!isManager) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  const canCreate = user.appRole.canCreateProjects;
  const creating = canCreate && searchParams.sekme === "yeni";

  const memberships = await prisma.boardMember.findMany({
    where: { userId: user.id },
    include: {
      board: {
        include: {
          _count: { select: { members: true } },
          lists: {
            include: {
              cards: { select: { id: true, status: true, assignees: { select: { userId: true } } } },
            },
          },
        },
      },
    },
    orderBy: { board: { createdAt: "desc" } },
  });

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <p className="section-label mb-2">İş alanları</p>
          <h1 className="page-title">Projeler</h1>
          <p className="page-subtitle">
            Projeler, görevleri aşamalara ayırdığınız yerdir. Günlük iş listeniz için İşlerim sayfasını kullanın.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTabs
            tabs={[
              { href: "/boards", label: "Tüm projeler", count: memberships.length, active: !creating },
              ...(canCreate
                ? [{ href: "/boards?sekme=yeni", label: "Yeni proje", create: true, active: creating }]
                : []),
            ]}
          />
          {!creating && memberships.length > 0 && (
            <BulkDeleteBar
              items={memberships.map((m) => ({ id: m.boardId, label: m.board.name }))}
              deleteAction={bulkDeleteBoardsAction}
              fieldName="boardIds"
            />
          )}
        </div>

        {creating ? (
          <div className="max-w-xl">
            <NewProjectPanel action={createBoardAction} />
          </div>
        ) : memberships.length === 0 ? (
          <div className="empty-state card-surface">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 mb-4 dark:bg-brand-950/60 dark:text-brand-300">
              <InboxIcon className="h-7 w-7" />
            </span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Henüz proje yok</p>
            <p className="text-xs mt-1.5 max-w-xs leading-relaxed">
              Örneğin Pazarlama, Ürün veya Destek. Görevleri Yapılacak → Devam ediyor → Bitti diye ilerletin.
            </p>
            {canCreate && (
              <Link href="/boards?sekme=yeni" className="btn mt-4">
                İlk projeyi oluştur
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {memberships.map(({ board, role }) => {
              const allCards = board.lists.flatMap((l) => l.cards);
              const totalCount = allCards.length;
              const doneCount = allCards.filter((c) => c.status === "DONE").length;
              const activeCount = allCards.filter(
                (c) => c.status !== "DONE" && c.status !== "CANCELLED"
              ).length;
              const mineCount = allCards.filter((c) => c.assignees.some((a) => a.userId === user.id)).length;
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
              const palette = boardPalette(board.id);
              return (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group card-surface overflow-hidden hover:shadow-lift hover:-translate-y-1 dark:hover:ring-slate-700 transition-all"
                >
                  <div className={`relative h-24 ${palette.header}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {ROLE_LABEL[role]}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h2 className="font-bold text-white text-lg leading-tight drop-shadow-sm line-clamp-1">
                        {board.name}
                      </h2>
                    </div>
                  </div>
                  <div className="p-4">
                    {board.description ? (
                      <p className="text-sm text-muted line-clamp-2 min-h-[40px]">{board.description}</p>
                    ) : (
                      <p className="text-sm text-faint italic min-h-[40px]">Açıklama yok</p>
                    )}

                    {/* İlerleme çubuğu */}
                    {totalCount > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <span className="text-muted font-medium">Tamamlanan</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {doneCount} / {totalCount}
                            <span className="font-normal text-faint ml-1">(%{pct})</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-faint mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <LayoutIcon className="h-3.5 w-3.5" />
                        {activeCount} açık iş
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>{mineCount} bana ait</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>{board._count.members} kişi</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
