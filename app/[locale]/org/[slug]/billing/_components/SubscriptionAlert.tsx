"use client";

import { useFormatters } from "@/hooks/use-formatters";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Clock,
    XCircle,
    CreditCard,
    Loader2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { createBillingPortalSession } from "@/actions/billing";
import type { BillingSubscription } from "./_lib/billing-types";

function getDaysRemaining(endDate: Date | string | null | undefined) {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}


/**
 * Top-level subscription status alert banner.
 * Displays urgent alerts for PAST_DUE, TRIALING (< 3 days), and CANCELED statuses.
 * Appears above all billing content for maximum visibility.
 */
export default function SubscriptionAlert({
    subscription,
    isOwner,
    organizationId,
}: {
    subscription: BillingSubscription;
    isOwner: boolean;
    organizationId: string;
}) {
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const pathname = usePathname();
    const { date: formatDateFor } = useFormatters();
    const formatDate = (date: Date | string) =>
        formatDateFor(date, { month: "long" });

    const status = subscription?.status;

    // Don't render if dismissed or no actionable status
    if (isDismissed) return null;

    const handleManageSubscription = async () => {
        try {
            setIsPortalLoading(true);
            // BUG FIX: third instance of the envelope defect — `url` is under
            // .data. See CurrentPlan.tsx and PaymentMethod.tsx.
            const result = await createBillingPortalSession(organizationId, pathname);
            if (!result.success) {
                toast.error(
                    result.error.message ||
                        "Failed to open billing portal. Please try again."
                );
                setIsPortalLoading(false);
                return;
            }
            window.location.href = result.data.url;
        } catch (error) {
            console.error("Failed to open billing portal:", error);
            toast.error(
                (error instanceof Error && error.message) ||
                    "Failed to open billing portal. Please try again."
            );
            setIsPortalLoading(false);
        }
    };

    // ---- PAST_DUE: Red banner ----
    if (status === "PAST_DUE") {
        return (
            <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 relative">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 dark:text-red-400 font-semibold">
                    Payment Failed
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300">
                    <p>
                        Your payment failed. Please update your payment method to avoid
                        service interruption.
                    </p>
                    {isOwner && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="mt-2"
                            onClick={handleManageSubscription}
                            disabled={isPortalLoading}
                        >
                            {isPortalLoading ? (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4 me-2" />
                            )}
                            Update Payment Method
                        </Button>
                    )}
                </AlertDescription>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-3 end-3 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                    aria-label="Dismiss alert"
                >
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        );
    }

    // ---- TRIALING with < 3 days: Amber banner ----
    if (subscription && status === "TRIALING") {
        const trialEnd = subscription.trialEndsAt || subscription.currentPeriodEnd;
        const daysLeft = getDaysRemaining(trialEnd);

        // Only show the top-level alert when trial is urgent (< 3 days)
        if (daysLeft === null || daysLeft > 3) return null;

        return (
            <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 relative">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-400 font-semibold">
                    {daysLeft === 0
                        ? "Your Trial Ends Today!"
                        : `Your Trial Ends in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`}
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <p>
                        {trialEnd
                            ? `Your trial ends on ${formatDate(trialEnd)}. Add a payment method to continue using all features.`
                            : "Your trial is ending soon. Add a payment method to continue after the trial ends."}
                    </p>
                    {isOwner && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
                            onClick={handleManageSubscription}
                            disabled={isPortalLoading}
                        >
                            {isPortalLoading ? (
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4 me-2" />
                            )}
                            Add Payment Method
                        </Button>
                    )}
                </AlertDescription>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-3 end-3 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
                    aria-label="Dismiss alert"
                >
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        );
    }

    // ---- CANCELED: Gray banner ----
    if (subscription && status === "CANCELED") {
        const accessEnd = subscription.currentPeriodEnd;

        return (
            <Alert className="border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700 relative">
                <XCircle className="h-4 w-4 text-gray-500" />
                <AlertTitle className="text-gray-800 dark:text-gray-300 font-semibold">
                    Subscription Canceled
                </AlertTitle>
                <AlertDescription className="text-gray-600 dark:text-gray-400">
                    <p>
                        {accessEnd
                            ? `Your subscription has been canceled. Access ends on ${formatDate(accessEnd)}.`
                            : "Your subscription has been canceled."}
                    </p>
                </AlertDescription>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-3 end-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    aria-label="Dismiss alert"
                >
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        );
    }

    // ACTIVE or no subscription — no top-level alert needed
    return null;
}
