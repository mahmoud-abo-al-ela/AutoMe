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
  // Transaction creates: org → working hours → owner membership → subscription → audit log
  return await db.$transaction(async (tx) => {
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
      const workingHoursData: Prisma.WorkingHoursCreateManyInput[] = Object.entries(
        workingHours
      ).map(
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

      await tx.workingHours.createMany({
        data: workingHoursData,
      });
    }

    await tx.membership.create({
      data: {
        userId,
        organizationId: org.id,
        role: "OWNER",
      },
    });

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

    // Typed explicitly: this is passed to tx.subscription.create as a variable,
    // and excess-property checking only fires on fresh object literals at the
    // call site. Without the annotation a column that does not exist compiles
    // fine and throws at runtime — which is exactly what stripePaymentIntentId
    // did (Subscription has no such column; persisting it needs a migration).
    const subscriptionData: Prisma.SubscriptionUncheckedCreateInput = {
      organizationId: org.id,
      planId,
      status,
      trialEndsAt,
      stripeSubscriptionId: stripeData.subscriptionId || null,
      stripeCustomerId: stripeData.customerId || null,
      stripeCheckoutSessionId: stripeData.checkoutSessionId || null,
      currentPeriodStart,
      currentPeriodEnd,
    };

    await tx.subscription.create({
      data: subscriptionData,
    });

    await auditHelpers.logOrgCreated(org, userId, userEmail);

    return org;
  });
}
