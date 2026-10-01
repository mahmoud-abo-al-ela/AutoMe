-- Stripe is gone: AutoMe bills through Paymob (see 20261001120000_paymob_billing).
-- No real Stripe customers existed, so nothing is carried over.

-- DropIndex
DROP INDEX "Plan_stripeProductId_key";

-- DropIndex
DROP INDEX "Plan_stripeMonthlyPriceId_key";

-- DropIndex
DROP INDEX "Plan_stripeYearlyPriceId_key";

-- DropIndex
DROP INDEX "Subscription_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "Subscription_stripeCheckoutSessionId_key";

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "stripeMonthlyPriceId",
DROP COLUMN "stripeProductId",
DROP COLUMN "stripeYearlyPriceId";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "stripeCheckoutSessionId",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId";

-- Plan prices in EGP piasters (owner, 2026-10-02): Pro EGP 800 a month,
-- Enterprise EGP 1,500; yearly is ten months (two months free). Editable in
-- the super-admin plan editor; the free Starter plan stays at 0.
UPDATE "Plan" SET "monthlyPrice" = 80000, "yearlyPrice" = 800000 WHERE "type" = 'PRO';
UPDATE "Plan" SET "monthlyPrice" = 150000, "yearlyPrice" = 1500000 WHERE "type" = 'ENTERPRISE';
