import { requireCanManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoleForm from "@/components/RoleForm";
import AdminRoleList from "@/components/AdminRoleList";
import SectionTabs from "@/components/SectionTabs";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { createRoleAction } from "./actions";

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: { error?: string; sekme?: string };
}) {
  await requireCanManageRoles();
  const creating = searchParams.sekme === "yeni";

  const roles = await prisma.appRole.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  return (
    <>
      <SectionTabs
        tabs={[
          { href: "/admin/roles", label: "Roller", count: roles.length, active: !creating },
          { href: "/admin/roles?sekme=yeni", label: "Yeni rol", create: true, active: creating },
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
            Yeni rol
          </h2>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Örneğin Grafiker veya Yazılımcı. İş açarken bu etikete basınca o roldeki herkes atanır.
          </p>
          <RoleForm action={createRoleAction} submitLabel="Rolü oluştur" />
        </div>
      ) : (
        <AdminRoleList roles={roles} />
      )}
    </>
  );
}
