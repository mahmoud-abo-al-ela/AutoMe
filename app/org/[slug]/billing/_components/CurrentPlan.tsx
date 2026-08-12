"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Car,
  Users,
  Settings,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createBillingPortalSession } from "@/actions/billing";
import {
  STATUS_CONFIG,
  PLAN_COLORS,
  formatDate,
} from "./_lib/current-plan-utils";
import StatusBanner from "./StatusBanner";
import UsageBar from "./UsageBar";
import type { BillingSubscription, BillingUsage } from "./_lib/billing-types";

export default function CurrentPlan({
  subscription,
  usage,
  isOwner,
  organizationId,
}: {
  subscription: BillingSubscription;
  usage: BillingUsage;
  isOwner: boolean;
  organizationId: string;
}) {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const pathname = usePathname();
  const plan = subscription?.plan;
  const planType = plan?.type || "STARTER";
  const status = subscription?.status;
  const hasStripeSubscription = !!subscription?.stripeCustomerId;

  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = statusConfig?.icon;

  const handleManageSubscription = async () => {
    try {
      setIsPortalLoading(true);
      // BUG FIX: this destructured `url` straight off the ActionResponse
      // envelope, where it lives under `.data`. It was therefore always
      // undefined and the redirect never reached Stripe's billing portal —
      // the same defect as the onboarding checkout one, missed in that sweep.
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
    <div className="space-y-4">
      {/* Status Banner */}
      <StatusBanner
        subscription={subscription}
        isOwner={isOwner}
        onManageSubscription={handleManageSubscription}
        isPortalLoading={isPortalLoading}
      />

      {/* Main Plan Card */}
      <Card
        className={
          statusConfig?.cardBorder
            ? `border ${statusConfig.cardBorder}`
            : undefined
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge className={PLAN_COLORS[planType]}>
                  {plan?.name || "Starter"}
                </Badge>
                {statusConfig && (
                  <Badge className={statusConfig.badge}>
                    {StatusIcon && (
                      <StatusIcon className="h-3 w-3 mr-1" />
                    )}
                    {statusConfig.badgeLabel}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {subscription && status === "ACTIVE" && subscription.currentPeriodEnd && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Renews on {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
                {subscription && status === "TRIALING" && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    Trial ends on{" "}
                    {/* A TRIALING subscription with neither date set would be a
                        data anomaly; previously it rendered the epoch. */}
                    {formatDate(
                      (subscription.trialEndsAt ||
                        subscription.currentPeriodEnd)!
                    )}
                  </span>
                )}
                {status === "PAST_DUE" && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Payment overdue — please update your payment method
                  </span>
                )}
                {subscription && status === "CANCELED" && subscription.currentPeriodEnd && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <XCircle className="h-3.5 w-3.5" />
                    Access ends on{" "}
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
                {!subscription && (
                  <span>You&apos;re on the free Starter plan</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && hasStripeSubscription && (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isPortalLoading}
                >
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <UsageBar
              icon={Car}
              label="Car Listings"
              current={usage.carCount}
              limit={plan?.maxCars ?? 0}
            />
            <UsageBar
              icon={Users}
              label="Team Members"
              current={usage.memberCount}
              limit={plan?.maxMembers ?? 0}
            />
            <UsageBar
              icon={Calendar}
              label="Test Drives (This Month)"
              current={usage.testDriveCount}
              limit={-1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
