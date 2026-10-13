-- One row per public MCP tool call, for the pilot's measures. No query text,
-- IP or user; see the McpToolCall model. Kept 30 days.

-- CreateTable
CREATE TABLE "McpToolCall" (
    "id" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "resultCount" INTEGER,
    "errorCode" TEXT,
    "clientFamily" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "McpToolCall_createdAt_idx" ON "McpToolCall"("createdAt");

-- CreateIndex
CREATE INDEX "McpToolCall_tool_createdAt_idx" ON "McpToolCall"("tool", "createdAt");
