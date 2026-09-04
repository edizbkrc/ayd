import { requireCanManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SectionTabs from "@/components/SectionTabs";
import CreateUserForm from "@/components/CreateUserForm";
import AdminUserList from "@/components/AdminUserList";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { createUserAction } from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { error?: string; sekme?: string };
}) {
  const admin = await requireCanManageUsers();
  const creating = searchParams.sekme === "yeni";

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        appRole: true,
        _count: { select: { ownedBoards: true, boardMembers: true, assignedCards: true } },
      },
    }),
    prisma.appRole.findMany({ orderBy: [{ isSystem: "desc" }, { name: "asc" }] }),
  ]);

  const defaultRoleId = roles.find((r) => r.isDefault)?.id ?? roles[0]?.id ?? "";

  return (
    <>
      <SectionTabs
        tabs={[
          { href: "/admin/users", label: "Kullanıcılar", count: users.length, active: !creating },
          { href: "/admin/users?sekme=yeni", label: "Yeni kullanıcı", create: true, active: creating },
        ]}
      />

      {searchParams.error && (
        <div className="error-box">
          <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{searchParams.error}</span>
        </div>
      )}

      {creating ? (
        <div className="card-surface p-5 sm:p-6">
          <h2 className="font-semibold mb-1 text-base flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <PlusIcon className="h-4 w-4" />
            </span>
            Yeni kullanıcı
          </h2>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            E-posta ve şifreyi siz belirlersiniz. Kullanıcı bu bilgilerle giriş yapar; rolünü sonradan da değiştirebilirsiniz.
          </p>
          <CreateUserForm
            action={createUserAction}
            roles={roles.map((r) => ({ id: r.id, name: r.name }))}
            defaultRoleId={defaultRoleId}
          />
        </div>
      ) : (
        <AdminUserList
          users={users}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          adminId={admin.id}
        />
      )}
    </>
  );
}
