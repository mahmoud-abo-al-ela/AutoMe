-- A dealership's description in each language. `description` stays the
-- dealer's own text; these are what the storefront shows per locale, one of
-- them a translation written after a profile save. Both start empty and are
-- filled on the next save or the first storefront view.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "descriptionAr" TEXT,
ADD COLUMN "descriptionEn" TEXT;
