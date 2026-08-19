"use client";

import { useState, useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CreditCard,
    Settings,
    Loader2,
    AlertCircle,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getPaymentMethod } from "@/actions/billing";
import { createBillingPortalSession } from "@/actions/billing";

// Keyed by Stripe's card brand string, which is open-ended; "Card" is the
// fallback for anything unlisted.
const BRAND_COLORS: Record<string, string> = {
    Visa: "text-blue-600 dark:text-blue-400",
    Mastercard: "text-orange-600 dark:text-orange-400",
    "American Express": "text-blue-700 dark:text-blue-300",
    Discover: "text-orange-500 dark:text-orange-300",
    "Diners Club": "text-blue-500 dark:text-blue-400",
    JCB: "text-green-600 dark:text-green-400",
    UnionPay: "text-red-600 dark:text-red-400",
    Card: "text-muted-foreground",
};

function PaymentMethodSkeleton() {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-18 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-9 w-36" />
        </div>
    );
}

type ManageProps = {
    isOwner: boolean;
    onManage: () => void;
    isLoading: boolean;
};

function NoPaymentMethod({ isOwner, onManage, isLoading }: ManageProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-18 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
                    <CreditCard className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        No payment method on file
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        Add a payment method to subscribe to a paid plan
                    </p>
                </div>
            </div>
            {isOwner && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onManage}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Add Payment Method
                </Button>
            )}
        </div>
    );
}

function CardDisplay({
    paymentMethod,
    isOwner,
    onManage,
    isLoading,
}: ManageProps & { paymentMethod: NonNullable<PaymentMethodData> }) {
    const brandColor = BRAND_COLORS[paymentMethod.brand] || BRAND_COLORS.Card;
    const isExpiringSoon = isCardExpiringSoon(
        paymentMethod.expMonth,
        paymentMethod.expYear
    );

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Card visual */}
                <div className="relative flex h-12 w-18 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 shadow-sm">
                    <span className="text-xs font-bold text-white tracking-wider">
                        •••• {paymentMethod.last4}
                    </span>
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <CreditCard className={`h-4 w-4 ${brandColor}`} />
                        <span className="text-sm font-medium">
                            {paymentMethod.brand} ending in {paymentMethod.last4}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span
                            className={`text-xs ${isExpiringSoon
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : "text-muted-foreground"
                                }`}
                        >
                            Expires {String(paymentMethod.expMonth).padStart(2, "0")}/
                            {paymentMethod.expYear}
                        </span>
                        {isExpiringSoon && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                — Expiring soon
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isOwner && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onManage}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Settings className="h-4 w-4 mr-2" />
                    )}
                    Update
                </Button>
            )}
        </div>
    );
}

function isCardExpiringSoon(expMonth: number, expYear: number) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Card expires within 2 months
    const expDate = new Date(expYear, expMonth - 1);
    const twoMonthsFromNow = new Date(currentYear, currentMonth + 1);

    return expDate <= twoMonthsFromNow;
}

/**
 * Displays the current payment method on file.
 * Shows card brand, last 4 digits, and expiry date.
 * Provides an "Update" button that opens the Stripe billing portal.
 */
/** The saved card as the billing action returns it, or null when there is none. */
type PaymentMethodData = Extract<
    Awaited<ReturnType<typeof getPaymentMethod>>,
    { success: true }
>["data"];

export default function PaymentMethod({
    organizationId,
    isOwner,
}: {
    organizationId: string;
    isOwner: boolean;
}) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        async function fetchPaymentMethod() {
            try {
                setIsLoading(true);
                setError(null);
                const result = await getPaymentMethod(organizationId);
                // BUG FIX: this stored the whole ActionResponse envelope in
                // state, so the card below read .brand/.last4 off { success,
                // data } and always got undefined — the saved card has never
                // rendered its details.
                if (!result.success) {
                    setError(result.error.message || "Failed to load payment method");
                    return;
                }
                setPaymentMethod(result.data);
            } catch (err) {
                console.error("Failed to fetch payment method:", err);
                setError(
                    (err instanceof Error && err.message) ||
                        "Failed to load payment method"
                );
            } finally {
                setIsLoading(false);
            }
        }

        fetchPaymentMethod();
    }, [organizationId]);

    const handleManagePayment = async () => {
        try {
            setIsPortalLoading(true);
            // BUG FIX: second instance of the envelope defect — `url` lives
            // under .data, so this redirect was always to undefined. See the
            // matching fix in CurrentPlan.tsx.
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

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-5 w-5" />
                            Payment Method
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Your payment method on file for subscription billing
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Secured by Stripe</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <PaymentMethodSkeleton />
                ) : error ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>Unable to load payment method</span>
                    </div>
                ) : paymentMethod ? (
                    <CardDisplay
                        paymentMethod={paymentMethod}
                        isOwner={isOwner}
                        onManage={handleManagePayment}
                        isLoading={isPortalLoading}
                    />
                ) : (
                    <NoPaymentMethod
                        isOwner={isOwner}
                        onManage={handleManagePayment}
                        isLoading={isPortalLoading}
                    />
                )}
            </CardContent>
        </Card>
    );
}
