"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
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
import type { BillingSubscription } from "./_lib/billing-types";

export default function StatusBanner({
  subscription,
  isOwner,
  onManageSubscription,
  isPortalLoading,
}: {
  subscription: BillingSubscription;
  isOwner: boolean;
  onManageSubscription: () => void;
  isPortalLoading: boolean;
}) {
  const t = useTranslations("org.billing.banner");
  const { locale, number } = useFormatters();
  const status = subscription?.status;

  // PAST_DUE — Red alert with "Update Payment Method" CTA
  if (status === "PAST_DUE") {
    return (
      <Alert className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-400">
          {t("pastDueTitle")}
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          <p>
            {t("pastDueBody")}
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
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 me-2" />
              )}
              {t("updatePayment")}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // TRIALING — Amber banner with days remaining
  if (subscription && status === "TRIALING") {
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
              ? t("trialEndsToday")
              : t("trialEndsInDays", {
                  count: daysLeft,
                  value: number(daysLeft),
                })
            : t("trialTitle")}
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <p>
            {trialEnd
              ? t("trialEndsOnBody", { date: formatDate(trialEnd, locale) })
              : t("trialActive")}
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
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 me-2" />
              )}
              {t("addPayment")}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // CANCELED — Gray banner with access end date
  if (subscription && status === "CANCELED") {
    const accessEnd = subscription.currentPeriodEnd;

    return (
      <Alert className="border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700">
        <XCircle className="h-4 w-4 text-gray-500" />
        <AlertTitle className="text-gray-800 dark:text-gray-300">
          {t("canceledTitle")}
        </AlertTitle>
        <AlertDescription className="text-gray-600 dark:text-gray-400">
          <p>
            {accessEnd
              ? t("canceledWithDate", { date: formatDate(accessEnd, locale) })
              : t("canceled")}
          </p>
          {isOwner && (
            <Button size="sm" className="mt-2">
              <ArrowUpRight className="h-4 w-4 me-2" />
              {t("resubscribe")}
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
          {t("freeTitle")}
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <p>
            {t("freeBody")}
          </p>
          {isOwner && (
            <Button size="sm" className="mt-2">
              <ArrowUpRight className="h-4 w-4 me-2" />
              {t("upgradeNow")}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // ACTIVE — No banner needed (status shown in card header)
  return null;
}
