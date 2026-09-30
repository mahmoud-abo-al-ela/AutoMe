-- Weekly summary email: a language and an opt-out per dealership, and a
-- ledger that makes each week's email send once.
ALTER TABLE "Organization" ADD COLUMN "emailLocale" TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE "Organization" ADD COLUMN "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "DigestSend" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestSend_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DigestSend_organizationId_weekStart_key" ON "DigestSend"("organizationId", "weekStart");

ALTER TABLE "DigestSend" ADD CONSTRAINT "DigestSend_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
