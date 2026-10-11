-- Buyer questions get their meaning as a vector (pgvector): to fold a
-- rephrased repeat into the question already in the dealer's inbox, rank the
-- dealer's answers against a new question, and suggest an answer given on
-- another car. On Supabase the extension may already exist (in the
-- `extensions` schema, which is on the search path); IF NOT EXISTS leaves it.
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "BuyerQuestion" ADD COLUMN "embedding" vector(768),
ADD COLUMN "embeddingModel" TEXT;

-- No vector index, on purpose. Every search is filtered to one car or one
-- dealership first, and pgvector's approximate (HNSW) index applies a filter
-- *after* picking its nearest candidates platform-wide — a dealership's own
-- questions would silently drop out as the table grows. Filtered, the sets are
-- a dealership's questions: small enough for an exact scan.
