-- Every car without Arabic features had an EMPTY search vector.
--
-- 20260924120000 appended the feature lists to the searchable document with
-- `array_to_string(features_ar, ' ')`. "featuresAr" is a nullable TEXT[] with
-- no default, and array_to_string(NULL, ...) is NULL — and one NULL in a `||`
-- chain makes the whole tsvector NULL. So every car listed before Arabic
-- features existed (and any saved without them) matched no full-text query at
-- all; searches only still found them through the trigram fallback, and never
-- by their Arabic title or description. Caught by the bilingual suite in
-- test/search.test.ts against a real Postgres.
--
-- The fix is a coalesce around both arrays. The signature is unchanged, but a
-- STORED generated column is not recomputed when the function body changes, so
-- the column is dropped and added again — which recomputes it for every row —
-- and its GIN index with it. See 20260922160000 for why this is the only way
-- to change what the column holds.

DROP INDEX IF EXISTS "Car_searchVector_idx";
ALTER TABLE "Car" DROP COLUMN IF EXISTS "searchVector";

CREATE OR REPLACE FUNCTION car_search_document(
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
  features       text[],
  features_ar    text[]
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
               -- NULL arrays (every car saved before a list existed) must not
               -- turn the whole document NULL: this line was the bug.
               coalesce(array_to_string(features, ' '), '') || ' ' ||
               coalesce(array_to_string(features_ar, ' '), '')
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
      "color", "location", "features", "featuresAr"
    )
  ) STORED;

CREATE INDEX "Car_searchVector_idx" ON "Car" USING GIN ("searchVector");
