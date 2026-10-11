-- A declined rephrasing of a question the dealer already answered stays its own
-- open question, linked to the answered one, with what the assistant told the
-- buyer: the dealer sees the assistant missed their answer.


-- AlterTable
ALTER TABLE "BuyerQuestion" ADD COLUMN     "declineMessage" TEXT,
ADD COLUMN     "relatedQuestionId" TEXT;

-- AddForeignKey
ALTER TABLE "BuyerQuestion" ADD CONSTRAINT "BuyerQuestion_relatedQuestionId_fkey" FOREIGN KEY ("relatedQuestionId") REFERENCES "BuyerQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

