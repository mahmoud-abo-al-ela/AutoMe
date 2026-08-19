-- Currency of record for Car.price.
--
-- AutoMe is Egypt-only, so every existing row is EGP and the DEFAULT backfills
-- them in place. NOT NULL is deliberate: a null here would mean "unknown
-- currency", which is never a legitimate state for a listed price.
ALTER TABLE "Car" ADD COLUMN "priceCurrency" TEXT NOT NULL DEFAULT 'EGP';
