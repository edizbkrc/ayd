import { prisma } from "@/lib/prisma";

export type { PickerRole, PickerUser } from "@/lib/assignee-types";

export function parseAssigneeIds(formData: FormData) {
  return [...new Set(formData.getAll("assigneeIds").map(String).filter(Boolean))];
}

export function parseRoleIds(formData: FormData) {
  return [...new Set(formData.getAll("assignRoleIds").map(String).filter(Boolean))];
}

export async function loadAssignablePeople() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { appRole: true },
    }),
    prisma.appRole.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      roleId: user.roleId,
      roleName: user.appRole.name,
      roleColor: user.appRole.color,
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
    })),
  };
}

/** Seçilen kişiler + seçilen rollerin tüm kullanıcıları. Projeye üye değilse üye yapılır. */
export async function resolveAssignees(boardId: string, formData: FormData) {
  const fromPeople = parseAssigneeIds(formData);
  const roleIds = parseRoleIds(formData);

  let fromRoles: string[] = [];
  if (roleIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { roleId: { in: roleIds } },
      select: { id: true },
    });
    fromRoles = users.map((u) => u.id);
  }

  const requested = [...new Set([...fromPeople, ...fromRoles])];
  if (requested.length === 0) return [];

  const valid = await prisma.user.findMany({
    where: { id: { in: requested } },
    select: { id: true },
  });
  const ids = valid.map((u) => u.id);
  if (ids.length === 0) return [];

  const existing = await prisma.boardMember.findMany({
    where: { boardId, userId: { in: ids } },
    select: { userId: true },
  });
  const have = new Set(existing.map((e) => e.userId));
  const missing = ids.filter((id) => !have.has(id));

  if (missing.length > 0) {
    await prisma.boardMember.createMany({
      data: missing.map((userId) => ({ boardId, userId, role: "MEMBER" as const })),
      skipDuplicates: true,
    });
  }

  return ids;
}
