-- A dealership's address in each language, like its description
-- (20261009120000_dealership_description_languages). `address` stays the
-- dealer's own text; these start empty and are filled on the next profile
-- save or the first storefront view.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "addressAr" TEXT,
ADD COLUMN "addressEn" TEXT;
