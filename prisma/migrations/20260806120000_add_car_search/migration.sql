-- Tier 2 search: full-text ranking (tsvector) + typo-tolerant fallback (pg_trgm).
--
-- The `searchVector` column and the three indexes below are also declared on the
-- Car model in schema.prisma so Prisma tracks them and does not report drift.
-- The generation function and the gin_trgm_ops operator classes cannot be fully
-- expressed in the Prisma schema, so this migration is the source of truth.

-- Fuzzy matching (similarity / the `%` operator) for the "did you mean" fallback.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Immutable builder for the weighted search document. A GENERATED column requires
-- an immutable expression, and `to_tsvector('simple', ...)` is not considered
-- immutable inline (the text->regconfig lookup is only stable). Declaring this
-- wrapper IMMUTABLE lets Postgres accept it in the generation expression.
--
-- Weights rank matches by importance: make/model = A, title = B, description = C,
-- and the remaining attribute columns + features = D. The 'simple' config skips
-- stemming and stop-words, so short tokens ("SUV", "EV") and model codes ("RAV4")
-- are indexed verbatim.
CREATE OR REPLACE FUNCTION car_search_document(
  make text,
  model text,
  title text,
  description text,
  body_type text,
  fuel_type text,
  transmission text,
  color text,
  location text,
  features text[]
) RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT setweight(to_tsvector('simple', coalesce(make, '') || ' ' || coalesce(model, '')), 'A')
      || setweight(to_tsvector('simple', coalesce(title, '')), 'B')
      || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
      || setweight(
           to_tsvector(
             'simple',
             coalesce(body_type, '')    || ' ' ||
             coalesce(fuel_type, '')     || ' ' ||
             coalesce(transmission, '')  || ' ' ||
             coalesce(color, '')         || ' ' ||
             coalesce(location, '')      || ' ' ||
             array_to_string(features, ' ')
           ),
           'D'
         );
$$;

-- Weighted, stored tsvector over every column the search box treats as free text.
ALTER TABLE "Car"
  ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
    car_search_document(
      "make", "model", "title", "description",
      "bodyType", "fuelType", "transmission",
      "color", "location", "features"
    )
  ) STORED;

-- Fast @@ tsquery matching and ts_rank() ordering.
CREATE INDEX "Car_searchVector_idx" ON "Car" USING GIN ("searchVector");

-- Trigram indexes backing the fuzzy fallback on the primary identity columns.
CREATE INDEX "Car_make_trgm_idx" ON "Car" USING GIN ("make" gin_trgm_ops);
CREATE INDEX "Car_model_trgm_idx" ON "Car" USING GIN ("model" gin_trgm_ops);
