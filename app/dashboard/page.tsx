import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { CheckSquareIcon, FolderIcon, BellIcon } from "@/components/icons";

function statusLabel(s: string) {
  const map: Record<string, string> = {
    TODO: "Yapılacak", IN_PROGRESS: "Devam ediyor",
    REVIEW: "İncelemede", DONE: "Tamamlandı", CANCELLED: "İptal",
  };
  return map[s] ?? s;
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    TODO: "bg-slate-400",
    IN_PROGRESS: "bg-blue-500",
    REVIEW: "bg-amber-500",
    DONE: "bg-emerald-500",
    CANCELLED: "bg-red-400",
  };
  return map[s] ?? "bg-slate-400";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isManager = user.appRole.canManageUsers || user.appRole.canManageRoles;

  // Kullanıcının üye olduğu board'lar
  const memberships = await prisma.boardMember.findMany({
    where: { userId: user.id },
    include: {
      board: {
        include: {
          lists: {
            include: {
              cards: { select: { status: true } },
            },
          },
        },
      },
    },
  });

  const boards = memberships.map((m) => {
    const allCards = m.board.lists.flatMap((l) => l.cards);
    return {
      id: m.board.id,
      name: m.board.name,
      role: m.role,
      total: allCards.length,
      done: allCards.filter((c) => c.status === "DONE").length,
    };
  });

  // Aktif işler: yönetici → tüm yönetilen board'lar, üye → sadece kendine atananlar
  const activeCards = isManager
    ? await prisma.card.findMany({
        where: {
          status: { notIn: ["DONE", "CANCELLED"] },
          list: { board: { members: { some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } } } } },
        },
        include: { list: { include: { board: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : (await prisma.cardAssignee.findMany({
        where: { userId: user.id },
        include: {
          card: {
            include: { list: { include: { board: { select: { id: true, name: true } } } } },
          },
        },
        orderBy: { card: { createdAt: "desc" } },
        take: 10,
      }))
        .filter((a) => a.card.status !== "DONE" && a.card.status !== "CANCELLED")
        .map((a) => a.card)
        .slice(0, 3);

  // Son aktiviteler
  const recentActivities = await prisma.cardActivity.findMany({
    where: isManager
      ? { card: { list: { board: { members: { some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } } } } } } }
      : { card: { assignees: { some: { userId: user.id } } } },
    include: {
      user: { select: { name: true } },
      card: { select: { id: true, title: true, list: { select: { board: { select: { id: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Manager için ek istatistikler
  let managerStats = null;
  if (isManager) {
    const [allUsers, allBoards, reviewCards, totalDone] = await Promise.all([
      prisma.user.count(),
      prisma.board.count({ where: { members: { some: { userId: user.id } } } }),
      prisma.card.count({
        where: { status: "REVIEW", list: { board: { members: { some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } } } } } },
      }),
      prisma.card.count({
        where: { status: "DONE", list: { board: { members: { some: { userId: user.id } } } } },
      }),
    ]);
    managerStats = { allUsers, allBoards, reviewCards, totalDone };
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar user={user} />
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Üst karşılama */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar name={user.name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {isManager ? "Yönetici Paneli" : "Genel Bakış"} · {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Manager istatistik kartları */}
      {isManager && managerStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Toplam Kullanıcı" value={managerStats.allUsers} icon={<UserIcon />} color="blue" />
          <StatCard label="Aktif Proje" value={managerStats.allBoards} icon={<FolderIcon className="h-5 w-5" />} color="violet" />
          <StatCard label="Onay Bekleyen" value={managerStats.reviewCards} icon={<BellIcon className="h-5 w-5" />} color="amber"
            href={managerStats.reviewCards > 0 ? "/boards" : undefined} />
          <StatCard label="Tamamlanan İş" value={managerStats.totalDone} icon={<CheckSquareIcon className="h-5 w-5" />} color="emerald" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sol: Benim işlerim */}
        <div className="lg:col-span-2 space-y-6">

          {/* Aktif işler */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <CheckSquareIcon className="h-4 w-4 text-brand-500" />
                {isManager ? "Aktif İşler" : "Aktif İşlerim"}
              </h2>
              <Link href="/isler" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                Tümünü gör →
              </Link>
            </div>
            {activeCards.length === 0 ? (
              <div className="card-surface p-6 text-center">
                <p className="text-sm text-muted">Aktif iş yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/boards/${card.list.board.id}/cards/${card.id}`}
                    className="card-surface p-3.5 flex items-center gap-3 hover:ring-brand-300 dark:hover:ring-brand-700 transition-all group"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor(card.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {card.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{card.list.board.name}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full
                      ${card.status === "REVIEW" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                        card.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {statusLabel(card.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Projeler özet — sadece yönetici */}
          {isManager && <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-brand-500" />
                Projeler
              </h2>
              <Link href="/boards" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                Tümünü gör →
              </Link>
            </div>
            {boards.length === 0 ? (
              <div className="card-surface p-6 text-center">
                <p className="text-sm text-muted">Henüz bir projeye dahil değilsiniz.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {boards.slice(0, 4).map((b) => {
                  const pct = b.total > 0 ? Math.round((b.done / b.total) * 100) : 0;
                  return (
                    <Link
                      key={b.id}
                      href={`/boards/${b.id}`}
                      className="card-surface p-4 hover:ring-brand-300 dark:hover:ring-brand-700 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                          {b.name}
                        </p>
                        <span className="text-xs text-muted shrink-0">{b.done}/{b.total}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted mt-1.5">%{pct} tamamlandı</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>}
        </div>

        {/* Sağ: Son aktiviteler */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-brand-500" />
              Son Aktiviteler
            </h2>
          </div>
          {recentActivities.length === 0 ? (
            <div className="card-surface p-6 text-center">
              <p className="text-sm text-muted">Henüz aktivite yok.</p>
            </div>
          ) : (
            <div className="card-surface divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivities.map((a) => (
                <Link
                  key={a.id}
                  href={`/boards/${a.card.list.board.id}/cards/${a.card.id}`}
                  className="flex gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{a.card.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {a.user.name.split(" ")[0]} · {activityText(a.action, a.toValue)}
                    </p>
                    <p className="text-[11px] text-faint mt-0.5">
                      {new Date(a.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}

function activityText(action: string, toValue: string | null) {
  if (action === "commented") return "yorum yaptı";
  const map: Record<string, string> = {
    DONE: "onayladı", REVIEW: "incelemeye gönderdi",
    IN_PROGRESS: "başladı / geri gönderdi", CANCELLED: "iptal etti", TODO: "sıfırladı",
  };
  return toValue ? map[toValue] ?? "güncelledi" : "güncelledi";
}

function StatCard({
  label, value, icon, color, href,
}: {
  label: string; value: number; icon: React.ReactNode; color: string; href?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300",
    violet: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-300",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300",
  };
  const inner = (
    <div className={`card-surface p-4 ${href ? "hover:ring-brand-300 dark:hover:ring-brand-700 transition-all" : ""}`}>
      <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}
