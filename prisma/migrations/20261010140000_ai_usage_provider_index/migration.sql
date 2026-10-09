-- The AI breaker reads the ledger per key (provider) and window when Redis is
-- not configured or fails, and seeds each month's token counter from it.


-- CreateIndex
CREATE INDEX "AiUsage_provider_createdAt_idx" ON "AiUsage"("provider", "createdAt");

