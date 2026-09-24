-- Arabic feature list per car, beside the English `features`.
--
-- Additive: `features` stays the source of record and nothing is backfilled. A
-- car written before this has an empty `featuresAr`, and resolveCarFeatures in
-- lib/utils/car-text.ts falls back to the English list for it.
--
-- ⚠️ As in 20260922160000: `searchVector` is a STORED generated column over
-- `car_search_document(...)`, so a column that is not an argument to that
-- function cannot be searched. And replacing the function does NOT recompute
-- the stored rows — the column has to be dropped and rebuilt.

ALTER TABLE "Car" ADD COLUMN "featuresAr" TEXT[];

-- Index depends on the column, column on the function: down in that order, up
-- in reverse.
DROP INDEX IF EXISTS "Car_searchVector_idx";
ALTER TABLE "Car" DROP COLUMN IF EXISTS "searchVector";

-- DROP, not CREATE OR REPLACE: the signature changes, and a replace would leave
-- the old one behind as an overload the generated column could keep using.
DROP FUNCTION IF EXISTS car_search_document(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text[]
);

-- Same weighting as before. Arabic features sit at D with the English ones, so
-- a car ranks the same whichever language found it.
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
               array_to_string(features, ' ') || ' ' ||
               array_to_string(features_ar, ' ')
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
