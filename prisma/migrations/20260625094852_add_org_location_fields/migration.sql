-- Add organization location metadata for platform discovery filters.
ALTER TABLE "Organization"
ADD COLUMN "city" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'EG';

CREATE INDEX "Organization_city_idx" ON "Organization"("city");
CREATE INDEX "Organization_isActive_deletedAt_idx" ON "Organization"("isActive", "deletedAt");
