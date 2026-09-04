import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, requireBoardMember, getBoardRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadAssignablePeople } from "@/lib/assignees";
import Navbar from "@/components/Navbar";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AvatarStack from "@/components/AvatarStack";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronRightIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import ManagerCardForm from "@/components/ManagerCardForm";
import AssigneePicker from "@/components/AssigneePicker";
import { ManagerAttachmentSection, MemberAttachmentViewSection, MemberUploadSection } from "@/components/AttachmentSection";
import {
  updateCardAction,
  deleteCardAction,
  updateCardStatusAction,
  addCommentAction,
  deleteAttachmentAction,
  addMemberNoteAction,
} from "./actions";
import type { CardStatus } from "@prisma/client";

const STATUS_LABEL: Record<CardStatus, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  REVIEW: "İncelemede",
  DONE: "Tamamlandı",
  CANCELLED: "İptal edildi",
};

const STATUS_BADGE: Record<CardStatus, string> = {
  TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

const ACTIVITY_LABEL: Record<string, string> = {
  status_changed: "durumu değiştirdi",
  commented: "yorum yaptı",
  created: "oluşturdu",
  assigned: "atandı",
};

function StatusBadge({ status }: { status: CardStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatusWorkflow({
  card,
  boardId,
  isManager,
  isAssignee,
}: {
  card: { id: string; status: CardStatus };
  boardId: string;
  isManager: boolean;
  isAssignee: boolean;
}) {
  const status = card.status;

  // DONE
  if (status === "DONE") {
    return (
      <div className="flex items-center gap-3">
        <StatusBadge status="DONE" />
        <span className="text-xs text-muted">Bu iş tamamlandı.</span>
        {isManager && (
          <form action={updateCardStatusAction}>
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="boardId" value={boardId} />
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <button type="submit" className="btn-secondary text-xs">Yeniden Aç</button>
          </form>
        )}
      </div>
    );
  }

  // CANCELLED
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3">
        <StatusBadge status="CANCELLED" />
        <span className="text-xs text-muted">Bu iş iptal edildi.</span>
        {isManager && (
          <form action={updateCardStatusAction}>
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="boardId" value={boardId} />
            <input type="hidden" name="status" value="TODO" />
            <button type="submit" className="btn-secondary text-xs">Yeniden Aç</button>
          </form>
        )}
      </div>
    );
  }

  // REVIEW — yönetici onay/red yapabilir; üye sadece durumu görür
  if (status === "REVIEW") {
    if (isManager) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusBadge status="REVIEW" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">İncelemenizi bekliyor</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={updateCardStatusAction}>
              <input type="hidden" name="cardId" value={card.id} />
              <input type="hidden" name="boardId" value={boardId} />
              <input type="hidden" name="status" value="DONE" />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
                ✓ Onayla
              </button>
            </form>
            <RejectForm cardId={card.id} boardId={boardId} />
            <form action={updateCardStatusAction}>
              <input type="hidden" name="cardId" value={card.id} />
              <input type="hidden" name="boardId" value={boardId} />
              <input type="hidden" name="status" value="CANCELLED" />
              <button type="submit" className="btn-secondary text-sm text-red-500 dark:text-red-400">İptal Et</button>
            </form>
          </div>
        </div>
      );
    }
    // Üye: sadece bilgi göster
    return (
      <div className="flex items-center gap-3">
        <StatusBadge status="REVIEW" />
        <span className="text-xs text-muted">Yönetici onayı bekleniyor</span>
      </div>
    );
  }

  // TODO veya IN_PROGRESS — yönetici için sadece durum + iptal; işi üye ilerletir
  if (isManager) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={status} />
        <span className="text-xs text-muted">
          {status === "TODO" ? "Henüz başlanmadı" : "Atanan kişi üzerinde çalışıyor"}
        </span>
        <form action={updateCardStatusAction}>
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="status" value="CANCELLED" />
          <button type="submit" className="btn-secondary text-sm text-red-500 dark:text-red-400">İptal Et</button>
        </form>
      </div>
    );
  }

  // Atanmış üye — işi ilerletebilir
  if (isAssignee) {
    if (status === "TODO") {
      return (
        <div className="flex items-center gap-2">
          <StatusBadge status="TODO" />
          <form action={updateCardStatusAction}>
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="boardId" value={boardId} />
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <button type="submit" className="btn text-sm">Çalışmaya Başla</button>
          </form>
        </div>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status="IN_PROGRESS" />
          <span className="text-xs text-muted">Dosya ekleyip hazır olunca incelemeye gönderin</span>
          <form action={updateCardStatusAction}>
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="boardId" value={boardId} />
            <input type="hidden" name="status" value="REVIEW" />
            <button type="submit" className="btn text-sm">İncelemeye Gönder</button>
          </form>
        </div>
      );
    }
  }

  // Atanmamış normal üye — sadece durum göster
  return <StatusBadge status={status} />;
}

function RejectForm({ cardId, boardId }: { cardId: string; boardId: string }) {
  return (
    <form action={updateCardStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="cardId" value={cardId} />
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="status" value="IN_PROGRESS" />
      <input
        name="note"
        placeholder="Geri gönderme notu (isteğe bağlı)"
        className="input text-sm py-1.5"
      />
      <button type="submit" className="btn-secondary text-sm text-amber-600 dark:text-amber-400 shrink-0">
        ↩ Geri Gönder
      </button>
    </form>
  );
}

export default async function CardDetailPage({
  params,
}: {
  params: { boardId: string; cardId: string };
}) {
  const user = await requireUser();
  await requireBoardMember(user.id, params.boardId);

  const card = await prisma.card.findUnique({
    where: { id: params.cardId },
    include: {
      list: { include: { board: true } },
      assignees: { include: { user: true } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!card || card.list.boardId !== params.boardId) notFound();

  const people = await loadAssignablePeople();
  const boardRole = await getBoardRole(user.id, params.boardId);
  const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
  const isAssignee = card.assignees.some((a) => a.userId === user.id);

  const dueDateValue = card.dueDate
    ? new Date(card.dueDate).toISOString().slice(0, 10)
    : "";

  // Ekleri yükleyene göre ayır: yönetici boardı yönetenlerin ID'leri
  const boardManagerIds = await prisma.boardMember.findMany({
    where: { boardId: params.boardId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  }).then((ms) => new Set(ms.map((m) => m.userId)));

  const managerAttachments = card.attachments.filter((a) => boardManagerIds.has(a.userId));
  const memberAttachments  = card.attachments.filter((a) => !boardManagerIds.has(a.userId));

  // Üye isimlerini userId → name olarak çöz
  const memberUserIds = [...new Set(memberAttachments.map((a) => a.userId))];
  const memberUsers = memberUserIds.length
    ? await prisma.user.findMany({ where: { id: { in: memberUserIds } }, select: { id: true, name: true } })
    : [];
  const memberUserMap = new Map(memberUsers.map((u) => [u.id, u.name]));

  // En son durum değişikliği aktivitesi
  const lastStatusChange = card.status === "IN_PROGRESS"
    ? card.activities.find((a) => a.action === "status_changed" && a.toValue === "IN_PROGRESS")
    : null;

  // Geri gönderme: en son değişiklik REVIEW'dan geliyorsa ve not varsa
  const lastRejection = lastStatusChange?.fromValue === "REVIEW" && lastStatusChange.note
    ? lastStatusChange
    : null;

  // Yeniden açma: en son değişiklik DONE veya CANCELLED'dan geliyorsa
  const reopenedBy = (lastStatusChange?.fromValue === "DONE" || lastStatusChange?.fromValue === "CANCELLED")
    ? lastStatusChange
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-faint mb-4">
          <Link href="/isler" className="link-hover">İşlerim</Link>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
          <Link href="/boards" className="link-hover">Projeler</Link>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
          <Link href={`/boards/${params.boardId}`} className="link-hover truncate max-w-[12rem]">
            {card.list.board.name}
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="badge-brand">{card.list.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="page-title truncate">{card.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <AvatarStack names={card.assignees.map((a) => a.user.name)} />
              {card.dueDate && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {new Date(card.dueDate).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <Link href={`/boards/${params.boardId}`} className="btn-secondary text-sm shrink-0">
            <ArrowLeftIcon className="h-4 w-4" />
            Projeye dön
          </Link>
        </div>

        {/* Geri gönderme uyarısı — atanmış üyeye göster */}
        {lastRejection && !isManager && (
          <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800/60 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-100/60 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/40">
              <svg className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Yönetici bu işi geri gönderdi
              </p>
              <span className="ml-auto text-xs text-red-500 dark:text-red-500">
                {new Date(lastRejection.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="px-4 py-3.5 flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400 shrink-0">
                {lastRejection.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-0.5">{lastRejection.user.name}</p>
                <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{lastRejection.note}</p>
              </div>
            </div>
            <div className="px-4 pb-3">
              <p className="text-xs text-red-500/80 dark:text-red-400/60">
                Düzeltmeleri yapıp tekrar incelemeye gönderin.
              </p>
            </div>
          </div>
        )}

        {/* İş tamamlandı — üyeye kilitli banner */}
        {card.status === "DONE" && !isManager && (
          <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-800/60 px-4 py-3 flex items-center gap-2.5">
            <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Bu iş yönetici tarafından onaylandı</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Tamamlanan işler üzerinde değişiklik yapılamaz.</p>
            </div>
          </div>
        )}

        {/* Yeniden açıldı banner'ı — atanmış üyeye göster */}
        {reopenedBy && !isManager && (
          <div className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800/60 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3">
              <svg className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Yönetici bu işi yeniden açtı
              </p>
              <span className="ml-auto text-xs text-blue-500 dark:text-blue-400">
                {new Date(reopenedBy.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        )}

        {/* Status Workflow */}
        <div className="card-surface p-4 sm:p-5 mb-6">
          <p className="section-label mb-3">Durum</p>
          <StatusWorkflow
            card={{ id: card.id, status: card.status }}
            boardId={params.boardId}
            isManager={isManager}
            isAssignee={isAssignee}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_21rem] gap-6 items-start">
          <div className="space-y-6">

            {/* Başlık & Açıklama — sadece yönetici düzenleyebilir */}
            {isManager ? (
              <ManagerCardForm
                cardId={card.id}
                boardId={params.boardId}
                defaultTitle={card.title}
                defaultDescription={card.description ?? ""}
                saveAction={updateCardAction}
              />
            ) : (
              /* Üyeler sadece görüntüler */
              <div className="card-surface p-5 sm:p-7 space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{card.title}</h2>
                {card.description ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{card.description}</p>
                ) : (
                  <p className="text-sm text-faint italic">Açıklama eklenmemiş.</p>
                )}
              </div>
            )}

            {isManager ? (
              <>
                <ManagerAttachmentSection
                  cardId={card.id}
                  boardId={params.boardId}
                  managerAtts={managerAttachments}
                  deleteAction={deleteAttachmentAction}
                />
                <MemberAttachmentViewSection
                  cardId={card.id}
                  boardId={params.boardId}
                  memberAtts={memberAttachments}
                  userMap={Object.fromEntries(memberUserMap)}
                  deleteAction={deleteAttachmentAction}
                />
              </>
            ) : isAssignee ? (
              <>
                {managerAttachments.length > 0 && (
                  <MemberAttachmentViewSection
                    cardId={card.id}
                    boardId={params.boardId}
                    memberAtts={managerAttachments}
                    userMap={{}}
                    deleteAction={deleteAttachmentAction}
                  />
                )}
                {card.status !== "DONE" && (
                  <MemberUploadSection
                    cardId={card.id}
                    boardId={params.boardId}
                    myAtts={memberAttachments.filter((a) => a.userId === user.id)}
                    noteAction={addMemberNoteAction}
                  />
                )}
              </>
            ) : managerAttachments.length > 0 ? (
              <MemberAttachmentViewSection
                cardId={card.id}
                boardId={params.boardId}
                memberAtts={managerAttachments}
                userMap={{}}
                deleteAction={deleteAttachmentAction}
              />
            ) : null}

            {/* Yorumlar */}
            <div className="card-surface p-5 sm:p-6 space-y-5">
              <p className="section-label">Yorumlar & Notlar</p>

              {card.comments.length === 0 && (
                <p className="text-sm text-faint">Henüz yorum yok.</p>
              )}

              {card.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-300 shrink-0">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{comment.user.name}</span>
                      <span className="text-[11px] text-faint">
                        {new Date(comment.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
                  </div>
                </div>
              ))}

              {isManager && (
                <form action={addCommentAction} className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input type="hidden" name="cardId" value={card.id} />
                  <input type="hidden" name="boardId" value={params.boardId} />
                  <div className="flex-1">
                    <textarea name="body" rows={2} placeholder="Yorum yaz..." className="input text-sm resize-none w-full" required />
                  </div>
                  <button type="submit" className="btn text-sm self-end shrink-0">Gönder</button>
                </form>
              )}
            </div>

            {/* Geçmiş */}
            {card.activities.length > 0 && (
              <div className="card-surface p-5 sm:p-6 space-y-3">
                <p className="section-label">Geçmiş</p>
                <ul className="space-y-2">
                  {card.activities.map((act) => (
                    <li key={act.id} className="flex gap-2 text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">{act.user.name}</span>
                      <span className="text-muted">{ACTIVITY_LABEL[act.action] ?? act.action}</span>
                      {act.action === "status_changed" && act.fromValue && act.toValue && (
                        <span className="text-faint">
                          {STATUS_LABEL[act.fromValue as CardStatus] ?? act.fromValue}
                          {" → "}
                          {STATUS_LABEL[act.toValue as CardStatus] ?? act.toValue}
                        </span>
                      )}
                      {act.note && act.action === "status_changed" && (
                        <span className="text-faint italic">— {act.note}</span>
                      )}
                      <span className="ml-auto text-[11px] text-faint shrink-0">
                        {new Date(act.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {!isManager && (
              <div className="card-surface p-5 space-y-5">
                <div>
                  <p className="section-label mb-1 flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    Atanan kişiler
                  </p>
                  <div className="mt-3 space-y-1">
                    {card.assignees.length === 0 ? (
                      <p className="text-xs text-faint">Henüz kimse atanmadı.</p>
                    ) : card.assignees.map((a) => (
                      <div key={a.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                        <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-300 shrink-0">
                          {a.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{a.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {card.dueDate && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="label flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" /> Bitiş tarihi
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                      {new Date(card.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isManager && (
              <div className="card-surface p-5 space-y-5">
                <div>
                  <p className="section-label mb-3 flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" /> Kim yapacak
                  </p>
                  <AssigneePicker
                    form="mgr-form"
                    users={people.users}
                    roles={people.roles}
                    defaultSelectedIds={card.assignees.map((a) => a.userId)}
                    lockedIds={[user.id]}
                  />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="label flex items-center gap-1.5" htmlFor="mgr-due">
                    <CalendarIcon className="h-3.5 w-3.5" /> Bitiş tarihi
                  </label>
                  <input form="mgr-form" className="input mt-1" id="mgr-due" name="dueDate" type="date" defaultValue={dueDateValue} />
                  <p className="text-[11px] text-faint mt-2">Kaydet butonuyla birlikte güncellenir.</p>
                </div>
              </div>
            )}

            {isManager && (
              <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Kalıcı İşlem</span>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bu işlemi sildiğinizde tüm içerik, dosyalar ve geçmiş kalıcı olarak kaldırılır.
                  </p>
                  <form action={deleteCardAction}>
                    <input type="hidden" name="boardId" value={params.boardId} />
                    <input type="hidden" name="cardId" value={card.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`"${card.title}" işini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800/60 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Bu işi kalıcı olarak sil
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
