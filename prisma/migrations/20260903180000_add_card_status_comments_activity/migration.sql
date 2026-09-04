-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "status" "CardStatus" NOT NULL DEFAULT 'TODO';

-- CreateTable
CREATE TABLE "CardComment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardActivity" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CardComment" ADD CONSTRAINT "CardComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardComment" ADD CONSTRAINT "CardComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardActivity" ADD CONSTRAINT "CardActivity_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardActivity" ADD CONSTRAINT "CardActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;