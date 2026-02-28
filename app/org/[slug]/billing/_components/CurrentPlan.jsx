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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Car,
  Users,
  ArrowUpRight,
  Settings,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  CreditCard,
  Info,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createBillingPortalSession } from "@/actions/billing";

// ============ STATUS CONFIGURATION ============

const STATUS_CONFIG = {
  ACTIVE: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    badgeLabel: "Active",
    cardBorder: "border-green-200 dark:border-green-800",
    icon: CheckCircle2,
    iconColor: "text-green-600",
  },
  TRIALING: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    badgeLabel: "Trial",
    cardBorder: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    iconColor: "text-amber-600",
  },
  PAST_DUE: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    badgeLabel: "Past Due",
    cardBorder: "border-red-300 dark:border-red-800",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  CANCELED: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    badgeLabel: "Canceled",
    cardBorder: "border-gray-300 dark:border-gray-700",
    icon: XCircle,
    iconColor: "text-gray-500",
  },
};

const PLAN_COLORS = {
  STARTER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ENTERPRISE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

// ============ HELPER FUNCTIONS ============

function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getUsagePercent(current, limit) {
  if (limit === -1) return 0;
  return Math.min((current / limit) * 100, 100);
}

/**
 * Get color class for usage progress bar based on percentage
 * Green < 60%, Yellow 60-80%, Red > 80%
 */
function getUsageColor(percent) {
  if (percent > 80) return "bg-red-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-green-500";
}

/**
 * Get text color class for usage percentage label
 */
function getUsageTextColor(percent) {
  if (percent > 80) return "text-red-600 dark:text-red-400";
  if (percent >= 60) return "text-amber-600 dark:text-amber-400";
  return "";
}

// ============ STATUS BANNER COMPONENT ============

function StatusBanner({ subscription, isOwner, onManageSubscription, isPortalLoading }) {
  const status = subscription?.status;

  // PAST_DUE — Red alert with "Update Payment Method" CTA
  if (status === "PAST_DUE") {
    return (
      <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-400">
          Payment Failed
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          <p>
            Your last payment failed. Please update your payment method to avoid
            service interruption.
          </p>
          {isOwner && (
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              onClick={onManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Update Payment Method
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // TRIALING — Amber banner with days remaining
  if (status === "TRIALING") {
    const trialEnd = subscription.trialEndsAt || subscription.currentPeriodEnd;
    const daysLeft = getDaysRemaining(trialEnd);
    const isUrgent = daysLeft !== null && daysLeft <= 3;

    return (
      <Alert
        className={
          isUrgent
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700"
            : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800"
        }
      >
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-400">
          {daysLeft !== null
            ? daysLeft === 0
              ? "Trial Ends Today"
              : `Trial Ends in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`
            : "Trial Period"}
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <p>
            {trialEnd
              ? `Your trial ends on ${formatDate(trialEnd)}. Add a payment method to continue using all features.`
              : "Your trial is active. Add a payment method to continue after the trial ends."}
          </p>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={onManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Add Payment Method
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // CANCELED — Gray banner with access end date
  if (status === "CANCELED") {
    const accessEnd = subscription.currentPeriodEnd;

    return (
      <Alert className="border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700">
        <XCircle className="h-4 w-4 text-gray-500" />
        <AlertTitle className="text-gray-800 dark:text-gray-300">
          Subscription Canceled
        </AlertTitle>
        <AlertDescription className="text-gray-600 dark:text-gray-400">
          <p>
            {accessEnd
              ? `Your subscription has been canceled. You'll retain access to your current plan features until ${formatDate(accessEnd)}.`
              : "Your subscription has been canceled."}
          </p>
          {isOwner && (
            <Button size="sm" className="mt-2">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Re-subscribe
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No subscription — Blue info card
  if (!subscription) {
    return (
      <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">
          Free Plan
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <p>
            You&apos;re on the free Starter plan. Upgrade to unlock more car
            listings, team members, and premium features.
          </p>
          {isOwner && (
            <Button size="sm" className="mt-2">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // ACTIVE — No banner needed (status shown in card header)
  return null;
}

// ============ USAGE BAR COMPONENT ============

function UsageBar({ icon: Icon, label, current, limit }) {
  const percent = getUsagePercent(current, limit);
  const isUnlimited = limit === -1;
  const colorClass = getUsageColor(percent);
  const textColorClass = getUsageTextColor(percent);
  const isNearLimit = !isUnlimited && percent > 80;
  const remaining = isUnlimited ? null : Math.max(0, limit - current);

  const tooltipContent = isUnlimited
    ? `${current} ${label.toLowerCase()} used — no limit`
    : `${current} of ${limit} used (${Math.round(percent)}%) — ${remaining} remaining`;

  return (
    <div className="space-y-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <span className={`font-medium ${textColorClass}`}>
                {current}
                {!isUnlimited ? ` / ${limit}` : ""}
              </span>
            </div>
            {!isUnlimited ? (
              <Progress
                value={percent}
                className="h-2 mt-2"
                indicatorClassName={colorClass}
              />
            ) : (
              <Badge variant="outline" className="text-xs mt-2">
                Unlimited
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
      {isNearLimit && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Running low?{" "}
          <a href="#plans" className="underline hover:no-underline font-medium">
            Upgrade for more
          </a>
        </p>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function CurrentPlan({
  subscription,
  usage,
  isOwner,
  organizationId,
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
      const { url } = await createBillingPortalSession(
        organizationId,
        pathname
      );
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      toast.error(
        error.message || "Failed to open billing portal. Please try again."
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
                {status === "ACTIVE" && subscription.currentPeriodEnd && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    Renews on {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
                {status === "TRIALING" && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    Trial ends on{" "}
                    {formatDate(
                      subscription.trialEndsAt ||
                      subscription.currentPeriodEnd
                    )}
                  </span>
                )}
                {status === "PAST_DUE" && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Payment overdue — please update your payment method
                  </span>
                )}
                {status === "CANCELED" && subscription.currentPeriodEnd && (
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
