-- Where each listing-assistant reply came from, and what it was. Declines and
-- off-topic replies are now kept too (outcome), so the super-admin quality
-- report can count them; existing rows were all answers. aiUsageId, model and
-- promptVersion trace a 👎 to the call that wrote it.


-- CreateEnum
CREATE TYPE "AssistantOutcome" AS ENUM ('ANSWERED', 'DECLINED', 'OFF_TOPIC');

-- AlterTable
ALTER TABLE "AssistantAnswer" ADD COLUMN     "aiUsageId" TEXT,
ADD COLUMN     "fieldsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "model" TEXT,
ADD COLUMN     "outcome" "AssistantOutcome" NOT NULL DEFAULT 'ANSWERED',
ADD COLUMN     "promptVersion" TEXT;

-- CreateIndex
CREATE INDEX "AssistantAnswer_createdAt_outcome_idx" ON "AssistantAnswer"("createdAt", "outcome");

