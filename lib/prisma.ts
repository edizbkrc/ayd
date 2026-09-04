import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion?: number;
};

const CLIENT_VERSION = 2;

if (globalForPrisma.prismaVersion !== CLIENT_VERSION) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaVersion = CLIENT_VERSION;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
