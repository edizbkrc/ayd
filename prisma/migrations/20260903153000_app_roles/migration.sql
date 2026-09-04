-- CreateTable
CREATE TABLE "AppRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'indigo',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppRole_name_key" ON "AppRole"("name");

-- Seed system roles
INSERT INTO "AppRole" ("id", "name", "description", "color", "isSystem", "isDefault", "canManageUsers", "canManageRoles")
VALUES
  ('role_admin', 'Yönetici', 'Kullanıcı ve rol yönetebilir, tüm panolara erişebilir.', 'indigo', true, false, true, true),
  ('role_member', 'Üye', 'Panolarda çalışır; site ayarlarını değiştiremez.', 'slate', true, true, false, false);

-- Add roleId
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

UPDATE "User" SET "roleId" = 'role_admin' WHERE "role" = 'ADMIN';
UPDATE "User" SET "roleId" = 'role_member' WHERE "role" = 'MEMBER' OR "roleId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN "role";

DROP TYPE "Role";
