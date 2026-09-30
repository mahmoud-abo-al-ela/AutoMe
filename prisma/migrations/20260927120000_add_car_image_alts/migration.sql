-- Alt text per car image, both languages, keyed by image URL:
-- { "<url>": { "en": "...", "ar": "..." } }.
--
-- Additive and nullable; nothing is backfilled. A car is described the next
-- time it is saved, and until then the gallery keeps its "Make Model — image n"
-- alt text.
--
-- Deliberately NOT an argument to car_search_document: it describes photos
-- ("rear three-quarter view"), and matching that in a car search is noise. So
-- unlike 20260924120000 the search vector is untouched.

ALTER TABLE "Car" ADD COLUMN "imageAlts" JSONB;
