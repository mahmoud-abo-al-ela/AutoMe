-- The dealership listing and the car city facet filter on the location columns
-- together, but only "city" was indexed, so the governorate half of every such
-- query was a sequential scan.
--
-- Ordered country -> region -> city to match the cascade the UI offers and the
-- order the filters are applied in, so a prefix of the index serves a query
-- that narrows by country and region without naming a city.
CREATE INDEX "Organization_country_region_city_idx" ON "Organization"("country", "region", "city");
