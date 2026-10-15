-- The dealer's financing note in English and Arabic, like the description and
-- address. Additive and nullable: existing notes are translated on the next
-- save or storefront view.
ALTER TABLE "Organization" ADD COLUMN "financingNoteEn" TEXT;
ALTER TABLE "Organization" ADD COLUMN "financingNoteAr" TEXT;
