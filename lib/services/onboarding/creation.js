import { db } from "@/lib/prisma";
import { auditHelpers } from "@/lib/services/audit/audit";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { mapStripeStatusToSubscriptionStatus } from "@/lib/services/webhook/stripe";
import { logError } from "@/lib/utils/errors";

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
  logoUrl,
  workingHours,
  userId,
  userEmail,
  planId,
  stripeData = {}, // { subscriptionId, customerId, checkoutSessionId, stripeSubscription }
}) {
  // Transaction creates: org → working hours → owner membership → subscription → audit log
  return await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name,
        slug,
        email,
        phone: phone || null,
        address: address || null,
        logo: logoUrl || null,
      },
    });

    if (workingHours) {
      const workingHoursData = Object.entries(workingHours).map(
        ([day, hours]) => ({
          organizationId: org.id,
          dayOfWeek: [day.toUpperCase()],
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
    let trialEndsAt = null;
    let status = "ACTIVE";
    let currentPeriodStart = now;
    let currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (stripeData.stripeSubscription) {
      status = mapStripeStatusToSubscriptionStatus(
        stripeData.stripeSubscription.status
      );
      if (stripeData.stripeSubscription.trial_end) {
        trialEndsAt = new Date(stripeData.stripeSubscription.trial_end * 1000);
      }
      if (stripeData.stripeSubscription.current_period_start) {
        currentPeriodStart = new Date(
          stripeData.stripeSubscription.current_period_start * 1000
        );
      }
      if (stripeData.stripeSubscription.current_period_end) {
        currentPeriodEnd = new Date(
          stripeData.stripeSubscription.current_period_end * 1000
        );
      }
    } else if (stripeData.trialDays && stripeData.trialDays > 0) {
      trialEndsAt = new Date(now.getTime() + stripeData.trialDays * 24 * 60 * 60 * 1000);
      status = "TRIALING";
    }

    const subscriptionData = {
      organizationId: org.id,
      planId,
      status,
      trialEndsAt,
      stripeSubscriptionId: stripeData.subscriptionId || null,
      stripeCustomerId: stripeData.customerId || null,
      stripeCheckoutSessionId: stripeData.checkoutSessionId || null,
      stripePaymentIntentId: stripeData.paymentIntentId || null,
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
