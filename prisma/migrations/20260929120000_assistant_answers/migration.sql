-- Answers the listing assistant gave, so a buyer can rate each one 👍 or 👎.
-- Additive: a new table only.

-- CreateTable
CREATE TABLE "AssistantAnswer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "helpful" BOOLEAN,
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantAnswer_organizationId_helpful_createdAt_idx" ON "AssistantAnswer"("organizationId", "helpful", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantAnswer_carId_createdAt_idx" ON "AssistantAnswer"("carId", "createdAt");

-- AddForeignKey
ALTER TABLE "AssistantAnswer" ADD CONSTRAINT "AssistantAnswer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantAnswer" ADD CONSTRAINT "AssistantAnswer_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
