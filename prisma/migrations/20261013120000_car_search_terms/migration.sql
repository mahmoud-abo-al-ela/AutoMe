-- The search's vocabulary: every word in a publicly listed car's search
-- vector, already folded (see fold_search_text), with how many cars have it.
--
-- It only proposes — typo corrections ("corola" → corolla) and, later, word
-- suggestions. Every candidate is checked against the searcher's own scope
-- before it is used or shown, so a stale vocabulary can miss a correction but
-- never adds a wrong one, and exact search never reads it. That is why a
-- materialized view (refreshed by the `search-terms` job and a daily cron) is
-- enough, where the results themselves must never be stale.
--
-- Public cars only, by the same rule the public search applies: an available
-- car of an active, undeleted dealership. A word that appears only in a hidden
-- car, or at a suspended dealership, is not in it.
--
-- Not declared in schema.prisma: Prisma does not manage materialized views,
-- and leaves objects it does not know alone.
--
-- Names are schema-qualified: since Postgres 17, REFRESH runs the query with
-- search_path set to pg_catalog only.
CREATE MATERIALIZED VIEW car_search_terms AS
  SELECT word, ndoc
  FROM ts_stat($q$
    SELECT c."searchVector"
    FROM public."Car" c
    JOIN public."Organization" o ON o."id" = c."organizationId"
    WHERE c."status" = 'AVAILABLE'
      AND o."isActive"
      AND o."deletedAt" IS NULL
  $q$)
WITH DATA;

-- REFRESH ... CONCURRENTLY (readers are never blocked) needs a unique index
-- over every row, with no WHERE.
CREATE UNIQUE INDEX car_search_terms_word_key ON car_search_terms (word);

-- Nearest words by spelling: `word % token` and similarity().
CREATE INDEX car_search_terms_word_trgm_idx ON car_search_terms USING GIN (word gin_trgm_ops);

-- A materialized view has no row-level security, and Supabase's API exposes
-- the public schema to these roles. The vocabulary is read only by the server.
-- The roles exist on Supabase only, so the revoke is skipped where they don't.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON car_search_terms FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON car_search_terms FROM authenticated;
  END IF;
END
$$;
