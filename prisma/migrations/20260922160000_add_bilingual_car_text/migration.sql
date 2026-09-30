-- Bilingual listing text: AR and EN titles and descriptions per car.
--
-- `title` and `description` stay exactly as they are and remain the source of
-- record. Nothing is backfilled and nothing changes for a car written before
-- this migration — the new columns are additive and nullable, and the resolver
-- in lib/utils/car-text.ts falls back to the originals.
--
-- ⚠️ The search vector is the part that is easy to get wrong. `searchVector` is
-- a STORED generated column over `car_search_document(...)`, so text that is not
-- an argument to that function is invisible to search no matter how it is
-- indexed. A dealer's Arabic description would be written into a column nobody
-- could search — exactly the bug 20260922120000 was written to fix, reintroduced
-- through a different door.
--
-- And as that migration records: replacing the function behind a STORED column
-- does NOT recompute the rows already stored. The column has to be dropped and
-- rebuilt, or the table answers two different ways depending on when a row was
-- written.

ALTER TABLE "Car"
  ADD COLUMN "titleEn"       TEXT,
  ADD COLUMN "titleAr"       TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionAr" TEXT;

-- The GIN index depends on the column, and the column depends on the function,
-- so they come down in that order and go back up in reverse.
DROP INDEX IF EXISTS "Car_searchVector_idx";
ALTER TABLE "Car" DROP COLUMN IF EXISTS "searchVector";

-- The argument list changes, so this is a DROP rather than a CREATE OR REPLACE:
-- replacing with a different signature would leave the old function in place as
-- an overload, and the generated column would silently keep using it.
DROP FUNCTION IF EXISTS car_search_document(
  text, text, text, text, text, text, text, text, text, text[]
);

-- Same weighting as before — make/model = A, titles = B, descriptions = C, the
-- remaining attributes + features = D. Each language sits at the same weight as
-- its counterpart, so a car ranks the same whether the query that found it was
-- Arabic or English.
CREATE FUNCTION car_search_document(
  make           text,
  model          text,
  title          text,
  title_en       text,
  title_ar       text,
  description    text,
  description_en text,
  description_ar text,
  body_type      text,
  fuel_type      text,
  transmission   text,
  color          text,
  location       text,
  features       text[]
) RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT setweight(
           to_tsvector(
             'simple',
             fold_search_text(coalesce(make, '') || ' ' || coalesce(model, ''))
           ),
           'A'
         )
      || setweight(
           to_tsvector(
             'simple',
             fold_search_text(
               coalesce(title, '')    || ' ' ||
               coalesce(title_en, '') || ' ' ||
               coalesce(title_ar, '')
             )
           ),
           'B'
         )
      || setweight(
           to_tsvector(
             'simple',
             fold_search_text(
               coalesce(description, '')    || ' ' ||
               coalesce(description_en, '') || ' ' ||
               coalesce(description_ar, '')
             )
           ),
           'C'
         )
      || setweight(
           to_tsvector(
             'simple',
             fold_search_text(
               coalesce(body_type, '')    || ' ' ||
               coalesce(fuel_type, '')     || ' ' ||
               coalesce(transmission, '')  || ' ' ||
               coalesce(color, '')         || ' ' ||
               coalesce(location, '')      || ' ' ||
               array_to_string(features, ' ')
             )
           ),
           'D'
         );
$$;

ALTER TABLE "Car"
  ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
    car_search_document(
      "make", "model",
      "title", "titleEn", "titleAr",
      "description", "descriptionEn", "descriptionAr",
      "bodyType", "fuelType", "transmission",
      "color", "location", "features"
    )
  ) STORED;

CREATE INDEX "Car_searchVector_idx" ON "Car" USING GIN ("searchVector");
