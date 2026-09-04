-- CreateTable
CREATE TABLE "CardAssignee" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CardAssignee_pkey" PRIMARY KEY ("id")
);

-- Copy existing single assignees
INSERT INTO "CardAssignee" ("id", "cardId", "userId")
SELECT CONCAT('asgn_', "id"), "id", "assigneeId"
FROM "Card"
WHERE "assigneeId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CardAssignee_cardId_userId_key" ON "CardAssignee"("cardId", "userId");

-- AddForeignKey
ALTER TABLE "CardAssignee" ADD CONSTRAINT "CardAssignee_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CardAssignee" ADD CONSTRAINT "CardAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old single assignee
ALTER TABLE "Card" DROP CONSTRAINT IF EXISTS "Card_assigneeId_fkey";
ALTER TABLE "Card" DROP COLUMN "assigneeId";
