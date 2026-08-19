import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { checkUser } from "@/lib/checkUser";
import {
    getOrganizationBySlug,
    getUserMembership,
} from "@/lib/getOrganization";
import { retrieveCheckoutSession } from "@/lib/services/stripe/subscription";
import { db } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Success page after a plan change via Stripe Checkout.
 * Verifies the checkout session and updates the local subscription record.
 */
export default async function BillingSuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { slug } = await params;
    const { session_id } = await searchParams;
    const locale = await getLocale();

    if (!session_id) {
        redirect({ href: `/org/${slug}/billing`, locale });
    }

    const user = await checkUser();
    if (!user) {
        redirect({ href: "/sign-in", locale });
    }

    const organization = await getOrganizationBySlug(slug);
    if (!organization) {
        redirect({ href: "/", locale });
    }

    const membership = await getUserMembership(user.id, organization.id);
    if (!membership || membership.role !== "OWNER") {
        redirect({ href: `/org/${slug}/billing`, locale });
    }

    // Retrieve the Stripe Checkout session
    let session;
    try {
        session = await retrieveCheckoutSession(session_id);
    } catch (error) {
        console.error("Failed to retrieve checkout session:", error);
        redirect({ href: `/org/${slug}/billing`, locale });
    }

    // Verify the session is for this organization
    const metadata = session.metadata || {};
    if (metadata.organizationId !== organization.id) {
        redirect({ href: `/org/${slug}/billing`, locale });
    }

    // Update the local subscription record if this is a plan change checkout
    if (metadata.type === "plan_change" && session.status === "complete") {
        const existingSubscription = await db.subscription.findUnique({
            where: { organizationId: organization.id },
        });

        // retrieveCheckoutSession does not pass `expand`, so Stripe returns
        // these as plain ids. The union type exists because expansion is
        // possible in general; narrowing here means that if expansion is ever
        // added, these degrade to null instead of writing an object into a
        // string column.
        const sessionSubscriptionId =
            typeof session.subscription === "string" ? session.subscription : null;
        const sessionCustomerId =
            typeof session.customer === "string" ? session.customer : null;

        if (existingSubscription) {
            // Update existing subscription with new Stripe data
            await db.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                    planId: metadata.planId,
                    status: "ACTIVE",
                    stripeSubscriptionId: sessionSubscriptionId || existingSubscription.stripeSubscriptionId,
                    stripeCustomerId: sessionCustomerId || existingSubscription.stripeCustomerId,
                    stripeCheckoutSessionId: session.id,
                },
            });
        } else {
            // Create a new subscription record
            await db.subscription.create({
                data: {
                    organizationId: organization.id,
                    planId: metadata.planId,
                    status: "ACTIVE",
                    stripeSubscriptionId: sessionSubscriptionId,
                    stripeCustomerId: sessionCustomerId,
                    stripeCheckoutSessionId: session.id,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                    ),
                },
            });
        }
    }

    // Get the new plan name for display
    const newPlan = metadata.planId
        ? await db.plan.findUnique({ where: { id: metadata.planId } })
        : null;

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Plan Updated Successfully!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        {newPlan
                            ? `You've successfully switched to the ${newPlan.name} plan.`
                            : "Your plan has been updated successfully."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Your new plan features are now active. Any billing changes will be
                        reflected in your next invoice.
                    </p>
                    <Button asChild className="w-full">
                        <Link href={`/org/${slug}/billing`}>Back to Billing</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
