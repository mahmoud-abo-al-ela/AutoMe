import type Stripe from "stripe";
import type {
  DayOfWeek,
  Organization,
  Prisma,
  SubscriptionStatus,
} from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { auditHelpers } from "@/lib/services/audit/audit";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { mapStripeStatusToSubscriptionStatus } from "@/lib/services/webhook/stripe/subscription-events";
import { logError } from "@/lib/utils/errors";
import type { OrganizationInput } from "@/lib/validations/schemas";

export type WorkingHoursInput = NonNullable<OrganizationInput["workingHours"]>;

/** The Stripe-derived facts the subscription row is built from. */
export interface OnboardingStripeData {
  subscriptionId?: string | null;
  customerId?: string | null;
  checkoutSessionId?: string | null;
  /**
   * Accepted because callers have it to hand, but NOT persisted: Subscription
   * has no stripePaymentIntentId column. Storing it would need a migration.
   */
  paymentIntentId?: string | null;
  trialDays?: number | null;
  stripeSubscription?: Stripe.Subscription | null;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  workingHours?: WorkingHoursInput | null;
  userId: string;
  userEmail?: string | null;
  planId: string;
  stripeData?: OnboardingStripeData;
}

/** The dealership's own details, as the onboarding form collected them. */
export type OrganizationDetails = Pick<
  CreateOrganizationInput,
  | "name"
  | "slug"
  | "email"
  | "phone"
  | "address"
  | "country"
  | "region"
  | "city"
  | "logoUrl"
  | "workingHours"
>;

/**
 * Create an organization, its working hours, the owner's membership and its
 * subscription, inside a transaction the caller owns, so a paid sign-up can
 * mark its payment and create the dealership as one unit.
 *
 * Writes no audit log: the audit helpers use their own connection, so the
 * caller logs once the transaction has committed.
 */
export async function createOrganizationRecords(
  tx: Prisma.TransactionClient,
  details: OrganizationDetails,
  ownerId: string,
  subscription: Omit<Prisma.SubscriptionUncheckedCreateInput, "organizationId">
): Promise<Organization> {
  const { name, slug, email, phone, address, country, region, city, logoUrl, workingHours } = details;

  const org = await tx.organization.create({
    data: {
      name,
      slug,
      email,
      phone: phone || null,
      address: address || null,
      // Prisma defaults country to "EG"; passing null would override that.
      ...(country ? { country } : {}),
      region: region || null,
      city: city || null,
      logo: logoUrl || null,
    },
  });

  if (workingHours) {
    const workingHoursData: Prisma.WorkingHoursCreateManyInput[] = Object.entries(workingHours).map(
      ([day, hours]) => ({
        organizationId: org.id,
        // Form keys are lowercase day names, so the uppercased key is the
        // DayOfWeek member; the record's key type can't express that.
        dayOfWeek: [day.toUpperCase() as DayOfWeek],
        openTime: hours.open,
        closeTime: hours.close,
        isOpen: !hours.closed,
      })
    );

    await tx.workingHours.createMany({ data: workingHoursData });
  }

  await tx.membership.create({
    data: { userId: ownerId, organizationId: org.id, role: "OWNER" },
  });

  await tx.subscription.create({
    data: { ...subscription, organizationId: org.id },
  });

  return org;
}

/**
 * Shared transaction block to create an organization, working hours,
 * owner membership, and subscription.
 */
export async function createOrganizationInTransaction({
  name,
  slug,
  email,
  phone,
  address,
  country,
  region,
  city,
  logoUrl,
  workingHours,
  userId,
  userEmail,
  planId,
  stripeData = {}, // { subscriptionId, customerId, checkoutSessionId, stripeSubscription }
}: CreateOrganizationInput): Promise<Organization> {
  // Subscription setup
  const now = new Date();
  let trialEndsAt: Date | null = null;
  let status: SubscriptionStatus = "ACTIVE";
  let currentPeriodStart = now;
  let currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (stripeData.stripeSubscription) {
    status = mapStripeStatusToSubscriptionStatus(
      stripeData.stripeSubscription.status
    );
    if (stripeData.stripeSubscription.trial_end) {
      trialEndsAt = new Date(stripeData.stripeSubscription.trial_end * 1000);
    }
    // The billing period lives on the subscription's items since the 2025
    // Basil API release; every item shares the same period. Falls back to the
    // 30-day window above if the subscription somehow has no items.
    const item = stripeData.stripeSubscription.items?.data?.[0];
    if (item) {
      currentPeriodStart = new Date(item.current_period_start * 1000);
      currentPeriodEnd = new Date(item.current_period_end * 1000);
    }
  } else if (stripeData.trialDays && stripeData.trialDays > 0) {
    trialEndsAt = new Date(now.getTime() + stripeData.trialDays * 24 * 60 * 60 * 1000);
    status = "TRIALING";
  }

  // Typed explicitly: excess-property checking only fires on fresh object
  // literals at the call site, so without the annotation a column that does
  // not exist compiles fine and throws at runtime — which is exactly what
  // stripePaymentIntentId did (Subscription has no such column).
  const subscriptionData: Omit<Prisma.SubscriptionUncheckedCreateInput, "organizationId"> = {
    planId,
    status,
    trialEndsAt,
    stripeSubscriptionId: stripeData.subscriptionId || null,
    stripeCustomerId: stripeData.customerId || null,
    stripeCheckoutSessionId: stripeData.checkoutSessionId || null,
    currentPeriodStart,
    currentPeriodEnd,
  };

  const org = await db.$transaction((tx) =>
    createOrganizationRecords(
      tx,
      { name, slug, email, phone, address, country, region, city, logoUrl, workingHours },
      userId,
      subscriptionData
    )
  );

  await auditHelpers.logOrgCreated(org, userId, userEmail);

  return org;
}
