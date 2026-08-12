-- Free-trial length granted when a subscription is created. 0 = no trial.
-- Added because actions/onboarding and the checkout webhook already read
-- plan.trialDays; the column never existed, so the TRIALING branch in
-- createOrganizationInTransaction was unreachable.
ALTER TABLE "Plan" ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 0;
