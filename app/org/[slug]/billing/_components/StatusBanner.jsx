import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  CreditCard,
  Info,
} from "lucide-react";
import { getDaysRemaining, formatDate } from "./_lib/current-plan-utils";

export default function StatusBanner({ subscription, isOwner, onManageSubscription, isPortalLoading }) {
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
