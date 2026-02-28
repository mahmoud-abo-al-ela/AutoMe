// Webhook service - Business logic for Stripe webhook events
import * as webhookRepo from "@/lib/repositories/webhook";
import {
    getOnboardingSession,
    markOnboardingSessionCompleted,
} from "@/lib/services/onboarding/session";
import { auditHelpers } from "@/lib/services/audit/audit";
import { db } from "@/lib/prisma";

/**
 * Map Stripe subscription status to our subscription status
 */
export function mapStripeStatusToSubscriptionStatus(stripeStatus) {
    const statusMap = {
        active: "ACTIVE",
        past_due: "PAST_DUE",
        canceled: "CANCELED",
        trialing: "TRIALING",
        incomplete: "PENDING",
        incomplete_expired: "CANCELED",
        unpaid: "PAST_DUE",
    };

    return statusMap[stripeStatus] || "PENDING";
}

/**
 * Handle subscription created/updated/deleted events
 */
export async function handleSubscriptionEvent(event) {
    const subscription = event.data.object;
    const { userId, planId, organizationId: metaOrgId } = subscription.metadata || {};

    if (!userId || !planId) {

        return { success: false, reason: "missing_metadata" };
    }

    // Use organizationId from metadata if available (plan change flow),
    // otherwise look up by userId (onboarding flow)
    let organizationId = metaOrgId;
    if (!organizationId) {
        const organization = await webhookRepo.findOrganizationByUserId(userId);
        if (!organization) {

            return { success: false, reason: "organization_not_found" };
        }
        organizationId = organization.id;
    }

    // Prepare subscription data
    const subscriptionData = {
        status: mapStripeStatusToSubscriptionStatus(subscription.status),
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
    };

    // Check if subscription already exists
    const existingSubscription = await webhookRepo.findSubscriptionByOrgId(organizationId);

    if (existingSubscription) {
        await webhookRepo.updateSubscriptionByOrgId(organizationId, subscriptionData);
    } else {
        await webhookRepo.createSubscription({
            ...subscriptionData,
            organizationId,
            planId,
        });
    }


    return { success: true, organizationId };
}

/**
 * Handle invoice paid event
 */
export async function handleInvoicePaid(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        return { success: false, reason: "no_subscription_id" };
    }

    // Find the subscription by Stripe subscription ID
    const subscription = await webhookRepo.findSubscriptionByStripeId(subscriptionId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to active
    await webhookRepo.updateSubscriptionById(subscription.id, {
        status: "ACTIVE",
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
    });


    return { success: true, subscriptionId: subscription.id };
}

/**
 * Handle invoice payment failed event
 */
export async function handleInvoicePaymentFailed(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        return { success: false, reason: "no_subscription_id" };
    }

    // Find the subscription by Stripe subscription ID
    const subscription = await webhookRepo.findSubscriptionByStripeId(subscriptionId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to past_due
    await webhookRepo.updateSubscriptionById(subscription.id, {
        status: "PAST_DUE",
    });


    return { success: true, subscriptionId: subscription.id };
}

/**
 * Handle payment intent succeeded event
 */
export async function handlePaymentIntentSucceeded(event) {
    const paymentIntent = event.data.object;
    const { userId, planId } = paymentIntent.metadata || {};

    if (!userId || !planId) {

        return { success: false, reason: "missing_metadata" };
    }

    // Find the organization for this user
    const organization = await webhookRepo.findOrganizationByUserId(userId);

    if (!organization) {

        return { success: false, reason: "organization_not_found" };
    }

    const organizationId = organization.id;

    // Find the subscription by organization ID
    const subscription = await webhookRepo.findSubscriptionByOrgId(organizationId);

    if (!subscription) {

        return { success: false, reason: "subscription_not_found" };
    }

    // Update subscription status to active if it was pending
    if (subscription.status === "PENDING") {
        await webhookRepo.updateSubscriptionById(subscription.id, {
            status: "ACTIVE",
        });

        return { success: true, organizationId, activated: true };
    }

    return { success: true, organizationId, activated: false };
}

/**
 * Handle checkout.session.completed event.
 * Routes to the appropriate handler based on the session metadata type.
 */
export async function handleCheckoutSessionCompleted(event) {
    const session = event.data.object;
    const metadata = session.metadata || {};

    // Route plan change checkouts to their own handler
    if (metadata.type === "plan_change") {
        return handlePlanChangeCheckoutCompleted(session, metadata);
    }

    // Otherwise, handle as onboarding checkout
    return handleOnboardingCheckoutCompleted(session, metadata);
}

/**
 * Handle checkout.session.completed for plan change sessions.
 * Updates the existing subscription with the new plan.
 */
async function handlePlanChangeCheckoutCompleted(session, metadata) {
    const { userId, planId, organizationId } = metadata;

    if (!userId || !planId || !organizationId) {

        return { success: false, reason: "missing_metadata" };
    }

    // Idempotency check
    const existingSub = await webhookRepo.findSubscriptionByCheckoutSessionId(session.id);
    if (existingSub) {
        await webhookRepo.updateSubscriptionById(existingSub.id, {
            status: "ACTIVE",
            planId,
        });

        return { success: true, reason: "already_processed" };
    }

    // Find existing subscription for the organization
    const subscription = await webhookRepo.findSubscriptionByOrgId(organizationId);

    if (subscription) {
        // Update existing subscription with new plan and Stripe data
        await webhookRepo.updateSubscriptionById(subscription.id, {
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription || subscription.stripeSubscriptionId,
            stripeCustomerId: session.customer || subscription.stripeCustomerId,
            stripeCheckoutSessionId: session.id,
        });
    } else {
        // Create new subscription record
        const now = new Date();
        await webhookRepo.createSubscription({
            organizationId,
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription || null,
            stripeCustomerId: session.customer || null,
            stripeCheckoutSessionId: session.id,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        });
    }

    // Log the plan change
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });

    const plan = await db.plan.findUnique({
        where: { id: planId },
        select: { name: true },
    });

    await db.auditLog.create({
        data: {
            action: subscription ? "SUBSCRIPTION_UPGRADED" : "SUBSCRIPTION_CREATED",
            entityType: "SUBSCRIPTION",
            entityId: subscription?.id || organizationId,
            organizationId,
            userId,
            userEmail: user?.email || null,
            newValue: { planName: plan?.name, planId },
        },
    });


    return { success: true, organizationId };
}

/**
 * Handle checkout.session.completed for onboarding sessions.
 * This is the fallback path — if the user closes the browser after payment
 * but before the /onboarding/success page loads, this webhook creates the org.
 */
async function handleOnboardingCheckoutCompleted(session, metadata) {
    const { userId, planId, onboardingSessionId, billingPeriod } = metadata;

    if (!userId || !planId || !onboardingSessionId) {

        return { success: false, reason: "missing_metadata" };
    }

    // 1. Idempotency check — has an org already been created for this checkout?
    const existingSub = await webhookRepo.findSubscriptionByCheckoutSessionId(session.id);
    if (existingSub) {
        // Org already created by the success page — just ensure subscription is ACTIVE
        await webhookRepo.updateSubscriptionById(existingSub.id, {
            status: "ACTIVE",
        });

        return { success: true, reason: "already_created" };
    }

    // 2. Load saved onboarding data
    const onboardingData = await getOnboardingSession(onboardingSessionId);
    if (!onboardingData) {
        console.error("Onboarding session not found for webhook:", onboardingSessionId);
        return { success: false, reason: "session_not_found" };
    }

    const { name, slug, email, phone, address, logo, workingHours } = onboardingData;

    // 3. Check if org with this slug already exists
    const existingOrg = await db.organization.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (existingOrg) {

        return { success: false, reason: "slug_taken" };
    }

    // 4. Get the plan
    const plan = await db.plan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        console.error("Plan not found for webhook:", planId);
        return { success: false, reason: "plan_not_found" };
    }

    // 5. Create organization with related data in a transaction
    try {
        const organization = await db.$transaction(async (tx) => {
            // Note: Logo upload from base64 is skipped in webhook context
            // The success page handles this. If the webhook creates the org,
            // the logo can be set later via settings.
            let logoUrl = null;
            if (logo && !logo.startsWith("data:image")) {
                // Already a URL, use it directly
                logoUrl = logo;
            }

            const org = await tx.organization.create({
                data: {
                    name,
                    slug,
                    email,
                    phone: phone || null,
                    address: address || null,
                    logo: logoUrl,
                },
            });

            // Create working hours
            if (workingHours) {
                const workingHoursData = Object.entries(workingHours).map(
                    ([day, hours]) => ({
                        organizationId: org.id,
                        dayOfWeek: [day.toUpperCase()],
                        openTime: hours.open,
                        closeTime: hours.close,
                        isOpen: !hours.closed,
                    }),
                );

                await tx.workingHours.createMany({
                    data: workingHoursData,
                });
            }

            // Create owner membership
            await tx.membership.create({
                data: {
                    userId,
                    organizationId: org.id,
                    role: "OWNER",
                },
            });

            // Create subscription
            const now = new Date();
            const subscriptionData = {
                organizationId: org.id,
                planId: plan.id,
                status: "ACTIVE",
                stripeSubscriptionId: session.subscription || null,
                stripeCustomerId: session.customer || null,
                stripeCheckoutSessionId: session.id,
                currentPeriodStart: now,
                currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            };

            await tx.subscription.create({
                data: subscriptionData,
            });

            return org;
        });

        // Log the organization creation
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        await auditHelpers.logOrgCreated(organization, userId, user?.email);

        // Mark onboarding session as completed
        await markOnboardingSessionCompleted(onboardingSessionId);


        return { success: true, organizationId: organization.id };
    } catch (error) {
        console.error("Error creating organization from webhook:", error);
        return { success: false, reason: "creation_failed" };
    }
}
