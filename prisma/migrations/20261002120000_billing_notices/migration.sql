-- A ledger of the billing emails the daily renewals job sends (renewal due,
-- reminder, past due, moved to the free plan): each is claimed once per
-- subscription period, so a re-run or a retry does not email twice.

-- CreateTable
CREATE TABLE "BillingNotice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingNotice_organizationId_kind_periodEnd_key" ON "BillingNotice"("organizationId", "kind", "periodEnd");

-- AddForeignKey
ALTER TABLE "BillingNotice" ADD CONSTRAINT "BillingNotice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

