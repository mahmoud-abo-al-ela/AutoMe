-- A visit that came from a public MCP answer's link (utm_source=mcp). No IP or
-- user; see the McpReferral model. Kept 30 days.

-- CreateTable
CREATE TABLE "McpReferral" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "McpReferral_createdAt_idx" ON "McpReferral"("createdAt");

-- CreateIndex
CREATE INDEX "McpReferral_medium_createdAt_idx" ON "McpReferral"("medium", "createdAt");
