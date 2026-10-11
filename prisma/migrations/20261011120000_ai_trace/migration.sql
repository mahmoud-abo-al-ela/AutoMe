-- What an AI call was given and replied, sampled and redacted, for debugging
-- a bad answer. Kept 14 days; see the AiTrace model.


-- CreateTable
CREATE TABLE "AiTrace" (
    "id" TEXT NOT NULL,
    "aiUsageId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTrace_aiUsageId_idx" ON "AiTrace"("aiUsageId");

-- CreateIndex
CREATE INDEX "AiTrace_createdAt_idx" ON "AiTrace"("createdAt");

