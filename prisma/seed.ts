import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.appRole.upsert({
    where: { name: "Yönetici" },
    update: {
      isSystem: true,
      canManageUsers: true,
      canManageRoles: true,
      canCreateProjects: true,
    },
    create: {
      id: "role_admin",
      name: "Yönetici",
      description: "Kullanıcı ve rol yönetebilir, proje oluşturabilir, tüm panolara erişebilir.",
      color: "indigo",
      isSystem: true,
      isDefault: false,
      canManageUsers: true,
      canManageRoles: true,
      canCreateProjects: true,
    },
  });

  const memberRole = await prisma.appRole.upsert({
    where: { name: "Üye" },
    update: {
      isSystem: true,
      isDefault: true,
    },
    create: {
      id: "role_member",
      name: "Üye",
      description: "Panolarda çalışır; site ayarlarını değiştiremez.",
      color: "slate",
      isSystem: true,
      isDefault: true,
      canManageUsers: false,
      canManageRoles: false,
    },
  });

  const designerRole = await prisma.appRole.upsert({
    where: { name: "Grafiker" },
    update: {},
    create: {
      name: "Grafiker",
      description: "Tasarım işleri bu etiketteki üyelere tek tıkla atanabilir.",
      color: "violet",
      canManageUsers: false,
      canManageRoles: false,
    },
  });

  const developerRole = await prisma.appRole.upsert({
    where: { name: "Yazılımcı" },
    update: {},
    create: {
      name: "Yazılımcı",
      description: "Yazılım işleri bu etiketteki üyelere tek tıkla atanabilir.",
      color: "sky",
      canManageUsers: false,
      canManageRoles: false,
    },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const memberPasswordHash = await bcrypt.hash("member123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { roleId: adminRole.id },
    create: {
      name: "Yönetici",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "uye@example.com" },
    update: { roleId: memberRole.id },
    create: {
      name: "Örnek Üye",
      email: "uye@example.com",
      passwordHash: memberPasswordHash,
      roleId: memberRole.id,
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: "grafiker@example.com" },
    update: { roleId: designerRole.id },
    create: {
      name: "Ayşe Grafiker",
      email: "grafiker@example.com",
      passwordHash: memberPasswordHash,
      roleId: designerRole.id,
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: "yazilimci@example.com" },
    update: { roleId: developerRole.id },
    create: {
      name: "Mehmet Yazılımcı",
      email: "yazilimci@example.com",
      passwordHash: memberPasswordHash,
      roleId: developerRole.id,
    },
  });

  const existingBoard = await prisma.board.findFirst({
    where: { name: "Proje Panosu" },
  });

  let boardId = existingBoard?.id;

  if (!existingBoard) {
    const board = await prisma.board.create({
      data: {
        name: "Proje Panosu",
        description: "Örnek pano - dilediğiniz gibi düzenleyin",
        ownerId: admin.id,
        members: {
          create: [
            { userId: admin.id, role: "OWNER" },
            { userId: member.id, role: "MEMBER" },
            { userId: designer.id, role: "MEMBER" },
            { userId: developer.id, role: "MEMBER" },
          ],
        },
        lists: {
          create: [
            { name: "Yapılacak", order: 0 },
            { name: "Devam Ediyor", order: 1 },
            { name: "Tamamlandı", order: 2 },
          ],
        },
      },
      include: { lists: true },
    });
    boardId = board.id;

    const todoList = board.lists.find((l) => l.name === "Yapılacak")!;
    const doingList = board.lists.find((l) => l.name === "Devam Ediyor")!;

    await prisma.card.create({
      data: {
        title: "Proje planını oluştur",
        description: "Kapsam ve zaman çizelgesini belirle",
        order: 0,
        listId: todoList.id,
        assignees: { create: [{ userId: admin.id }] },
      },
    });
    await prisma.card.create({
      data: {
        title: "Takım üyelerini davet et",
        order: 1,
        listId: todoList.id,
        assignees: { create: [{ userId: admin.id }, { userId: member.id }] },
      },
    });
    await prisma.card.create({
      data: {
        title: "Tasarım taslağını hazırla",
        order: 0,
        listId: doingList.id,
        assignees: { create: [{ userId: member.id }] },
      },
    });
  } else if (boardId) {
    await prisma.boardMember.createMany({
      data: [
        { boardId, userId: designer.id, role: "MEMBER" },
        { boardId, userId: developer.id, role: "MEMBER" },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed tamamlandı.");
  console.log("Giriş bilgileri:");
  console.log("  Yönetici  -> admin@example.com / admin123");
  console.log("  Üye       -> uye@example.com / member123");
  console.log("  Grafiker  -> grafiker@example.com / member123");
  console.log("  Yazılımcı -> yazilimci@example.com / member123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
