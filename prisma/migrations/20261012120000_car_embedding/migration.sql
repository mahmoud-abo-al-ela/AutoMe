-- Cars get their meaning as a vector, for search that finds what a buyer means
-- rather than only the words they typed. The vector extension exists since
-- 20261011140000. No vector index, as for buyer questions: searches filter
-- first (available cars, the buyer's filters), and an approximate index would
-- filter after choosing its candidates.


-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "embedding" vector(768),
ADD COLUMN     "embeddingHash" TEXT,
ADD COLUMN     "embeddingModel" TEXT;

