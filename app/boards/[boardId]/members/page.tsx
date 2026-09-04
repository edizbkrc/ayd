import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, requireBoardMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import RoleBadge from "@/components/RoleBadge";
import SectionTabs from "@/components/SectionTabs";
import MemberRoleForm from "@/components/MemberRoleForm";
import AddMemberForm from "@/components/AddMemberForm";
import { ChevronRightIcon, AlertIcon } from "@/components/icons";
import { addMemberAction, changeMemberRoleAction, removeMemberAction } from "./actions";

export default async function BoardMembersPage({
  params,
  searchParams,
}: {
  params: { boardId: string };
  searchParams: { error?: string; sekme?: string };
}) {
  const user = await requireUser();
  const role = await requireBoardMember(user.id, params.boardId);
  if (role === "MEMBER") redirect(`/boards/${params.boardId}`);

  const board = await prisma.board.findUnique({ where: { id: params.boardId } });
  if (!board) notFound();

  const members = await prisma.boardMember.findMany({
    where: { boardId: params.boardId },
    include: { user: { include: { appRole: true } } },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });

  // Projede olmayan tüm kullanıcılar
  const memberUserIds = new Set(members.map((m) => m.userId));
  const allUsers = await prisma.user.findMany({
    include: { appRole: true },
    orderBy: { name: "asc" },
  });
  const candidates = allUsers
    .filter((u) => !memberUserIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleName: u.appRole.name,
      roleColor: u.appRole.color,
    }));

  const adding = searchParams.sekme === "ekle";
  const base = `/boards/${board.id}/members`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        <div className="flex flex-wrap items-center gap-1.5 text-sm text-faint mb-4">
          <Link href="/isler" className="link-hover">İşlerim</Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <Link href="/boards" className="link-hover">Projeler</Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <Link href={`/boards/${board.id}`} className="link-hover">{board.name}</Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="text-slate-500 dark:text-slate-400">Ekip</span>
        </div>

        <h1 className="page-title mb-1">Proje ekibi</h1>
        <p className="page-subtitle mb-5">
          Renkli etiket sitedeki rolüdür. Sağdaki seçim bu projede yönetici mi üye mi olduğunu belirler.
        </p>

        <SectionTabs
          tabs={[
            { href: base, label: "Üyeler", count: members.length, active: !adding },
            { href: `${base}?sekme=ekle`, label: "Üye ekle", create: true, active: adding },
          ]}
        />

        {searchParams.error && (
          <div className="error-box mb-4">
            <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{searchParams.error}</span>
          </div>
        )}

        {adding ? (
          <div className="card-surface p-5 sm:p-6">
            <h2 className="font-semibold text-base mb-4">Ekibe üye ekle</h2>
            <AddMemberForm
              action={addMemberAction}
              boardId={board.id}
              candidates={candidates}
            />
          </div>
        ) : (
          <div className="card-surface divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.user.name} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {m.user.name}
                      </p>
                      <RoleBadge name={m.user.appRole.name} color={m.user.appRole.color} />
                    </div>
                    <p className="text-xs text-muted truncate">{m.user.email}</p>
                  </div>
                </div>

                {m.role === "OWNER" ? (
                  <span className="badge-brand shrink-0">Sahip</span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <MemberRoleForm
                      action={changeMemberRoleAction}
                      boardId={board.id}
                      userId={m.userId}
                      currentRole={m.role}
                    />
                    <form action={removeMemberAction}>
                      <input type="hidden" name="boardId" value={board.id} />
                      <input type="hidden" name="userId" value={m.userId} />
                      <ConfirmSubmitButton
                        confirmMessage={`${m.user.name} adlı kullanıcıyı bu projeden çıkarmak istediğinize emin misiniz?`}
                        className="btn-danger btn-sm"
                      >
                        Çıkar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
