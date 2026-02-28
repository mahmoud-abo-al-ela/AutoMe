-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DealershipLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealershipLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealershipReview" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealershipReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealershipLocation_organizationId_key" ON "DealershipLocation"("organizationId");

-- CreateIndex
CREATE INDEX "DealershipLocation_city_idx" ON "DealershipLocation"("city");

-- CreateIndex
CREATE INDEX "DealershipLocation_state_idx" ON "DealershipLocation"("state");

-- CreateIndex
CREATE INDEX "DealershipReview_organizationId_idx" ON "DealershipReview"("organizationId");

-- CreateIndex
CREATE INDEX "DealershipReview_userId_idx" ON "DealershipReview"("userId");

-- CreateIndex
CREATE INDEX "DealershipReview_isApproved_idx" ON "DealershipReview"("isApproved");

-- CreateIndex
CREATE INDEX "DealershipReview_rating_idx" ON "DealershipReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "DealershipReview_organizationId_userId_key" ON "DealershipReview"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Organization_averageRating_idx" ON "Organization"("averageRating");

-- AddForeignKey
ALTER TABLE "DealershipLocation" ADD CONSTRAINT "DealershipLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealershipReview" ADD CONSTRAINT "DealershipReview_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealershipReview" ADD CONSTRAINT "DealershipReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
