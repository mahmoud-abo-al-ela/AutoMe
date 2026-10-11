-- Buyer questions get their meaning as a vector (pgvector): to fold a
-- rephrased repeat into the question already in the dealer's inbox, rank the
-- dealer's answers against a new question, and suggest an answer given on
-- another car. On Supabase the extension may already exist (in the
-- `extensions` schema, which is on the search path); IF NOT EXISTS leaves it.
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "BuyerQuestion" ADD COLUMN "embedding" vector(768),
ADD COLUMN "embeddingModel" TEXT;

-- Cosine distance, approximate nearest neighbours. Prisma cannot declare an
-- HNSW index, so it lives here only (see the BuyerQuestion model).
CREATE INDEX "BuyerQuestion_embedding_idx" ON "BuyerQuestion" USING hnsw ("embedding" vector_cosine_ops);
