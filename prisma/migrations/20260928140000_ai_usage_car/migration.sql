-- A plan's AI allowance counts cars saved with AI's help, not AI calls: the
-- calls that led to a car are stamped with its id when the dealer saves it.
-- Additive and nullable: existing rows count as not yet saved.

-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "carId" TEXT;
