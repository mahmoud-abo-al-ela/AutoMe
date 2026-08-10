// Stripe checkout.session.completed handlers
import type Stripe from "stripe";
import { logError } from "@/lib/utils/errors";
import type { StripeEventOf, WebhookHandlerResult } from "./subscription-events";
import * as webhookRepo from "@/lib/repositories/webhook";
import {
  getOnboardingSession,
  markOnboardingSessionCompleted,
} from "@/lib/services/onboarding/session";
import { auditHelpers } from "@/lib/services/audit/audit";
import { db } from "@/lib/prisma";
import { createOrganizationInTransaction } from "@/lib/services/onboarding/creation";

/**
 * Checkout sessions carry customer/subscription unexpanded, so these arrive as
 * ID strings; the object branch exists only to narrow the expandable union.
 */
function idOf(
    value: string | { id: string } | null | undefined
): string | null {
    if (!value) return null;
    return typeof value === "string" ? value : value.id;
}

export async function handleCheckoutSessionCompleted(
    event: StripeEventOf<Stripe.Checkout.Session>
): Promise<WebhookHandlerResult> {
    const session = event.data.object;
    const metadata: Stripe.Metadata = session.metadata || {};

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
async function handlePlanChangeCheckoutCompleted(
    session: Stripe.Checkout.Session,
    metadata: Stripe.Metadata
): Promise<WebhookHandlerResult> {
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
            stripeSubscriptionId:
                idOf(session.subscription) || subscription.stripeSubscriptionId,
            stripeCustomerId: idOf(session.customer) || subscription.stripeCustomerId,
            stripeCheckoutSessionId: session.id,
        });
    } else {
        // Create new subscription record
        const now = new Date();
        await webhookRepo.createSubscription({
            organizationId,
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: idOf(session.subscription),
            stripeCustomerId: idOf(session.customer),
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
async function handleOnboardingCheckoutCompleted(
    session: Stripe.Checkout.Session,
    metadata: Stripe.Metadata
): Promise<WebhookHandlerResult> {
    const { userId, planId, onboardingSessionId, billingPeriod } = metadata;

    if (!userId || !planId || !onboardingSessionId) {

        return { success: false, reason: "missing_metadata" };
    }

    const existingSub = await webhookRepo.findSubscriptionByCheckoutSessionId(session.id);
    if (existingSub) {
        // Org already created by the success page — just ensure subscription is ACTIVE
        await webhookRepo.updateSubscriptionById(existingSub.id, {
            status: "ACTIVE",
        });

        return { success: true, reason: "already_created" };
    }

    const onboardingData = await getOnboardingSession(onboardingSessionId);
    if (!onboardingData) {
        logError("Onboarding session not found for webhook:", onboardingSessionId);
        return { success: false, reason: "session_not_found" };
    }

    const { name, slug, email, phone, address, logo, workingHours } = onboardingData;

    const existingOrg = await db.organization.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (existingOrg) {

        return { success: false, reason: "slug_taken" };
    }

    const plan = await db.plan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        logError("Plan not found for webhook:", planId);
        return { success: false, reason: "plan_not_found" };
    }

    let logoUrl = null;
    if (logo && !logo.startsWith("data:image")) {
        logoUrl = logo;
    }

    const stripeData = {
        subscriptionId: idOf(session.subscription),
        customerId: idOf(session.customer),
        checkoutSessionId: session.id,
        // BUG (surfaced by this conversion, NOT fixed here): the Plan model has
        // no trialDays column, so this is always undefined and the TRIALING
        // branch in createOrganizationInTransaction is dead. actions/onboarding
        // reads the same non-existent field twice. Behaviour preserved; adding
        // the column (or dropping the branch) belongs in its own PR.
        trialDays: (plan as { trialDays?: number }).trialDays,
    };

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });

    const organization = await createOrganizationInTransaction({
        name,
        slug,
        email,
        phone,
        address,
        logoUrl,
        workingHours,
        userId,
        userEmail: user?.email,
        planId: plan.id,
        stripeData,
    });

    // Mark onboarding session as completed
    await markOnboardingSessionCompleted(onboardingSessionId);

    return { success: true, organizationId: organization.id };
}
