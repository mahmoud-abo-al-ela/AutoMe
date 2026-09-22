-- Arabic normalization for car search, applied to the INDEX side.
--
-- `to_tsvector('simple', …)` does no stemming and no stop-words, which is what
-- makes it safe for a mixed-script catalogue — but it also does no Arabic
-- normalization, and Arabic writes the same word several ways. Without this a
-- dealer's "سيارة" is unreachable by a buyer's "سياره", and a year copied out
-- of an Arabic page ("٢٠٢٠") matches nothing at all.
--
-- ⚠️ The query side folds with `foldSearchText` in lib/utils/search-text.ts.
-- The two MUST agree. Folding one side only is worse than folding neither:
-- results stop being incomplete and start being arbitrary. `test/search.test.ts`
-- runs shared fixtures through both and asserts they match.
--
-- The generated column is dropped and rebuilt rather than left alone: replacing
-- the function behind a STORED generated column does not recompute what is
-- already stored, so every existing row would keep an unfolded vector and the
-- table would answer two different ways depending on when a row was written.

-- Folds what Arabic readers write interchangeably. Pure string operations, so
-- it is genuinely IMMUTABLE and usable in a generation expression.
--
-- Every Arabic character is written as an escape rather than a literal. Two
-- reasons: a bidi editor renders these strings in an order that is not their
-- storage order, and `translate()` reads its two arguments as parallel lists of
-- code points — so a mapping that merely *looks* aligned is a silent corruption.
CREATE OR REPLACE FUNCTION fold_search_text(value text) RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT translate(
    regexp_replace(
      lower(value),
      -- Tashkeel and the combining hamzas (064B-0655), the dagger alef (0670)
      -- and the tatweel (0640) — all invisible to a search.
      --
      -- The range stops at 0655 and the last two are listed on their own. One
      -- range from 064B to 0670 reads as "the Arabic marks" and quietly
      -- swallows the Arabic-Indic digits sitting between them, which have to
      -- survive this step to be folded to ASCII in the next one.
      E'[\u064B-\u0655\u0670\u0640]',
      '',
      'g'
    ),
    -- FROM: alef-hamza-above, alef-hamza-below, alef-madda, alef-wasla,
    --       ta-marbuta, alef-maqsura
    E'\u0623\u0625\u0622\u0671\u0629\u0649'
    --       Arabic-Indic digits
      || E'\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'
    --       extended Arabic-Indic digits
      || E'\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9',
    -- TO:   alef, alef, alef, alef, heh, yeh
    E'\u0627\u0627\u0627\u0627\u0647\u064A'
      || '0123456789'
      || '0123456789'
  );
$$;

-- The GIN index depends on the column, so it goes first and comes back after.
DROP INDEX IF EXISTS "Car_searchVector_idx";
ALTER TABLE "Car" DROP COLUMN IF EXISTS "searchVector";

-- Same weighting as before (make/model = A, title = B, description = C, the
-- remaining attributes + features = D); every input now folded on the way in.
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
  SELECT setweight(
           to_tsvector(
             'simple',
             fold_search_text(coalesce(make, '') || ' ' || coalesce(model, ''))
           ),
           'A'
         )
      || setweight(to_tsvector('simple', fold_search_text(coalesce(title, ''))), 'B')
      || setweight(
           to_tsvector('simple', fold_search_text(coalesce(description, ''))),
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
      "make", "model", "title", "description",
      "bodyType", "fuelType", "transmission",
      "color", "location", "features"
    )
  ) STORED;

CREATE INDEX "Car_searchVector_idx" ON "Car" USING GIN ("searchVector");
