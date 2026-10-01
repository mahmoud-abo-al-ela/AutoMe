import type { BillingPeriod, Prisma } from "@/lib/generated/prisma";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/prisma";
import * as billingRepo from "@/lib/repositories/billing";
import { findUserOwnedOrganization } from "@/lib/repositories/user";
import { isSlugTaken } from "@/lib/repositories/payment";
import { auditHelpers } from "@/lib/services/audit/audit";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { createOrganizationRecords, type OrganizationDetails } from "@/lib/services/onboarding/creation";
import { resolveLogoUrl } from "@/lib/services/onboarding/logo";
import { getOnboardingSessionForUser } from "@/lib/services/onboarding/session";
import { ConflictError, NotFoundError, ValidationError, logError } from "@/lib/utils/errors";
import { startCheckout, type Checkout } from "./checkout";
import { trialPeriod } from "./periods";
import { planSignupKind } from "@/lib/utils/plan-signup";

/**
 * A new dealership's first plan, three ways:
 *
 *   free plan  — created at once, nothing to pay, ever;
 *   trial      — a paid plan with trial days: created at once as TRIALING,
 *                with no payment upfront (Paymob links cannot keep a card for
 *                later). The first payment link goes out before the trial ends
 *                like any renewal (owner's choice, 2026-10-01);
 *   paid       — a Paymob checkout first; the dealership is created when the
 *                payment settles (settle.ts).
 */

export interface SignupUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

/** One dealership per owner; the slug must still be free. */
async function assertCanCreate(userId: string, slug: string): Promise<void> {
  if (await findUserOwnedOrganization(userId)) {
    throw new ConflictError("User already owns a dealership", { key: "errors.onboarding.alreadyOwner" });
  }
  if (await isSlugTaken(db, slug)) {
    throw new ConflictError("This URL slug is already taken", { key: "errors.onboarding.slugTaken" });
  }
}

async function activePlan(planId: string) {
  const plan = await billingRepo.findPlanById(planId);
  if (!plan || !plan.isActive) throw new NotFoundError("Plan");
  return plan;
}

/** The paid path: a checkout for a saved onboarding session. */
export async function startSignupCheckout({
  user,
  onboardingSessionId,
  planId,
  billingPeriod,
  locale,
}: {
  user: SignupUser;
  onboardingSessionId: string;
  planId: string;
  billingPeriod: BillingPeriod;
  locale: Locale;
}): Promise<Checkout> {
  const session = await getOnboardingSessionForUser(onboardingSessionId, user.id);
  if (!session) {
    throw new NotFoundError("Onboarding session", { key: "errors.onboarding.sessionExpired" });
  }

  const plan = await activePlan(planId);
  if (planSignupKind(plan) !== "paid") {
    // Free and trial plans start without paying (createUnpaidOrganization).
    throw new ValidationError(`Plan ${plan.type} does not start with a payment`, "planId", {
      key: "errors.invalidInput",
    });
  }

  // Checked now as well as at settlement, so nobody pays for a name they
  // cannot have; settlement still copes if it goes in between.
  await assertCanCreate(user.id, session.slug);

  return startCheckout({
    purpose: "SIGNUP",
    onboardingSessionId,
    planId: plan.id,
    billingPeriod,
    locale,
    payer: { userId: user.id, name: user.name, email: user.email },
    dealership: { name: session.name, email: session.email, phone: session.phone },
  });
}

/**
 * The free and trial paths: the dealership is created now. A paid plan
 * without a trial is refused: it is only ever created by a settled payment,
 * whatever the client sends.
 */
export async function createUnpaidOrganization({
  user,
  details,
  logo,
  planId,
  billingPeriod,
  now = new Date(),
}: {
  user: SignupUser;
  details: Omit<OrganizationDetails, "logoUrl">;
  logo?: string | null;
  planId: string;
  billingPeriod: BillingPeriod;
  now?: Date;
}) {
  const plan = await activePlan(planId);
  const kind = planSignupKind(plan);
  if (kind === "paid") {
    throw new ValidationError(`Plan ${plan.type} must be paid for at checkout`, "planId", {
      key: "errors.billing.checkoutRequired",
    });
  }

  await assertCanCreate(user.id, details.slug);

  let subscription: Omit<Prisma.SubscriptionUncheckedCreateInput, "organizationId">;
  if (kind === "trial") {
    const trial = trialPeriod(plan.trialDays, now);
    subscription = {
      planId: plan.id,
      status: "TRIALING",
      billingPeriod,
      trialEndsAt: trial.end,
      currentPeriodStart: trial.start,
      currentPeriodEnd: trial.end,
    };
  } else {
    // The free plan has no period to end and nothing to renew.
    subscription = { planId: plan.id, status: "ACTIVE", billingPeriod: "MONTHLY", currentPeriodStart: now };
  }

  const logoUrl = await resolveLogoUrl(logo, details.slug);
  const organization = await db.$transaction((tx) =>
    createOrganizationRecords(tx, { ...details, logoUrl }, user.id, subscription)
  );

  await auditHelpers.logOrgCreated(organization, user.id, user.email);

  // Skipped for accounts with no address (phone-only Clerk sign-ups).
  if (user.email) {
    sendWelcomeEmail({
      to: user.email,
      userName: user.name || "there",
      dealershipName: organization.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${organization.slug}/dashboard`,
    }).catch((error) => logError(error));
  }

  return organization;
}
