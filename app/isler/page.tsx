import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadAssignablePeople } from "@/lib/assignees";
import Navbar from "@/components/Navbar";
import NewTaskPanel from "@/components/NewTaskPanel";
import TaskRow, { type TaskItem } from "@/components/TaskRow";
import BulkTaskList from "@/components/BulkTaskList";
import { CheckSquareIcon, InboxIcon, PlusIcon } from "@/components/icons";
import { dueStatus, startOfDay } from "@/lib/dates";
import { createTaskAndReturnId, bulkDeleteCardsAction } from "./actions";

type Tab = "mine" | "overdue" | "today" | "all" | "biten" | "yeni";

function toItem(card: {
  id: string;
  title: string;
  dueDate: Date | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  assignees: { user: { name: string } }[];
  list: { name: string; board: { id: string; name: string } };
}): TaskItem {
  return {
    id: card.id,
    title: card.title,
    dueDate: card.dueDate,
    status: card.status,
    boardId: card.list.board.id,
    boardName: card.list.board.name,
    listName: card.list.name,
    assigneeNames: card.assignees.map((a) => a.user.name),
  };
}

export default async function IslerPage({
  searchParams,
}: {
  searchParams: { filtre?: string };
}) {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const isManager = user.appRole.canCreateProjects || user.appRole.canManageUsers || user.appRole.canManageRoles;

  const rawTab = searchParams.filtre;
  const validTabs = ["mine", "overdue", "today", "all", "biten", "yeni"];
  const defaultTab = isManager ? "all" : "mine";
  const tab = (validTabs.includes(rawTab || "") ? rawTab : defaultTab) as Tab;

  const [memberships, people] = await Promise.all([
    prisma.boardMember.findMany({
      where: { userId: user.id },
      select: { boardId: true, board: { select: { id: true, name: true } } },
    }),
    loadAssignablePeople(),
  ]);

  const boardIds = memberships.map((m) => m.boardId);
  const projects = memberships.map((m) => ({ id: m.board.id, name: m.board.name }));

  const commonInclude = {
    assignees: { include: { user: true } },
    list: { include: { board: true } },
  } as const;

  // Yönetici tüm kartları görür; üye sadece kendine atananları
  const assigneeFilter = !isManager ? { assignees: { some: { userId: user.id } } } : {};

  const [activeCards, doneCards] = boardIds.length
    ? await Promise.all([
        prisma.card.findMany({
          where: {
            list: { boardId: { in: boardIds } },
            status: { notIn: ["DONE", "CANCELLED"] },
            ...assigneeFilter,
          },
          include: commonInclude,
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        }),
        prisma.card.findMany({
          where: {
            list: { boardId: { in: boardIds } },
            status: "DONE",
            ...assigneeFilter,
          },
          include: commonInclude,
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  const openCards = activeCards;
  const mineOpen = openCards.filter((c) => c.assignees.some((a) => a.userId === user.id));
  const overdue = openCards.filter((c) => dueStatus(c.dueDate) === "overdue");
  const today = openCards.filter((c) => dueStatus(c.dueDate) === "today");

  const shown =
    tab === "overdue" ? overdue
    : tab === "today" ? today
    : tab === "all" ? openCards
    : tab === "biten" ? doneCards
    : openCards; // "mine" sekmesi artık sadece üyelerde; openCards zaten assigneeFilter ile filtrelenmiş

  const grouped = {
    overdue: shown.filter((c) => dueStatus(c.dueDate) === "overdue"),
    today: shown.filter((c) => dueStatus(c.dueDate) === "today"),
    soon: shown.filter((c) => dueStatus(c.dueDate) === "soon"),
    rest: shown.filter((c) => {
      const s = dueStatus(c.dueDate);
      return s === "later" || s === "none";
    }),
  };

  const filterTabs = isManager
    ? [
        { id: "all" as Tab, label: "Tüm işler", count: openCards.length },
        { id: "overdue" as Tab, label: "Geciken", count: overdue.length },
        { id: "today" as Tab, label: "Bugün", count: today.length },
        { id: "biten" as Tab, label: "Biten işler", count: doneCards.length },
      ]
    : [
        { id: "mine" as Tab, label: "İşlerim", count: openCards.length },
        { id: "overdue" as Tab, label: "Geciken", count: overdue.length },
        { id: "today" as Tab, label: "Bugün", count: today.length },
        { id: "biten" as Tab, label: "Biten işler", count: doneCards.length },
      ];

  const sections: { key: keyof typeof grouped; title: string }[] = [
    { key: "overdue", title: "Geciken" },
    { key: "today", title: "Bugün" },
    { key: "soon", title: "Yaklaşan" },
    { key: "rest", title: tab === "mine" ? (isManager ? "Sıradaki" : "İşlerim") : "Diğer açık işler" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Başlık + istatistik */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="section-label mb-1">İşlerim</p>
            <h1 className="page-title">Merhaba, {firstName}</h1>
            <p className="page-subtitle">
              {startOfDay().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 p-1 rounded-2xl bg-white/70 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-800">
            {[
              { label: "Geciken", value: overdue.length, tone: overdue.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400" },
              { label: "Bugün", value: today.length, tone: today.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400" },
              { label: "Aktif", value: openCards.length, tone: "text-brand-600 dark:text-brand-400" },
              { label: "Biten", value: doneCards.length, tone: doneCards.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400" },
            ].map((s, i, arr) => (
              <div key={s.label} className={`flex items-center gap-2 px-4 py-2 ${i < arr.length - 1 ? "border-r border-slate-200/70 dark:border-slate-700" : ""}`}>
                <p className={`text-xl font-bold leading-none ${s.tone}`}>{s.value}</p>
                <p className="text-xs text-muted leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sekmeler + Yeni iş butonu */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white/70 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-800">
            {filterTabs.map((item) => {
              const active = tab === item.id;
              const isBiten = item.id === "biten";
              return (
                <Link
                  key={item.id}
                  href={item.id === defaultTab ? "/isler" : `/isler?filtre=${item.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                    active
                      ? isBiten
                        ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:ring-emerald-800"
                        : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {isBiten && <span className="text-emerald-500">✓</span>}
                  {item.label}
                  <span className={`text-[11px] rounded-full px-1.5 font-medium ${
                    active
                      ? isBiten
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span id="isler-bulk-slot" className="flex items-center gap-2 empty:hidden" />
            <Link
              href="/isler?filtre=yeni"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                tab === "yeni"
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${
                tab === "yeni" ? "bg-white/20" : "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400"
              }`}>
                <PlusIcon className="h-3.5 w-3.5" />
              </span>
              Yeni iş
            </Link>
          </div>
        </div>

        {/* İçerik */}
        {tab === "yeni" ? (
          <NewTaskPanel
            action={createTaskAndReturnId}
            projects={projects}
            users={people.users}
            roles={people.roles}
            currentUserId={user.id}
            currentUserIsManager={isManager}
          />
        ) : tab === "biten" ? (
          doneCards.length === 0 ? (
            <div className="empty-state card-surface">
              <CheckSquareIcon className="h-10 w-10 mb-3 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Henüz tamamlanan iş yok</p>
              <p className="text-xs mt-1.5 max-w-sm leading-relaxed">Onaylanan işler burada görünecek.</p>
            </div>
          ) : (
            <div className="card-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Onaylanan işler</h2>
                </div>
                <span className="badge">{doneCards.length}</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {doneCards.map((card) => (
                  <TaskRow key={card.id} task={toItem(card)} />
                ))}
              </div>
            </div>
          )
        ) : boardIds.length === 0 ? (
          <div className="empty-state card-surface">
            <InboxIcon className="h-10 w-10 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Henüz bir projeye eklenmediniz</p>
            <p className="text-xs mt-1.5 max-w-sm leading-relaxed">
              Bir yönetici sizi projeye ekledikten sonra işleriniz burada görünecek.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="empty-state card-surface">
            <CheckSquareIcon className="h-10 w-10 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Burada iş yok</p>
            <p className="text-xs mt-1.5 max-w-sm leading-relaxed">
              {tab === "mine" ? "Henüz atanmış açık iş yok." : "Bu filtrede açık iş bulunmuyor."}
            </p>
            <Link href="/isler?filtre=yeni" className="btn mt-4">
              <PlusIcon className="h-4 w-4" />
              Yeni iş ekle
            </Link>
          </div>
        ) : (
          <BulkTaskList
            isManager={isManager}
            deleteAction={bulkDeleteCardsAction}
            sections={sections.map((s) => ({
              key: s.key,
              title: s.title,
              items: grouped[s.key].map(toItem),
            }))}
          />
        )}

      </main>
    </div>
  );
}
