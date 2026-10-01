"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Car,
  Users,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { isFreePlan } from "@/lib/utils/plan-change";
import { STATUS_CONFIG, PLAN_COLORS } from "./_lib/current-plan-utils";
import UsageBar from "./UsageBar";
import { useBillingActions } from "./use-billing-actions";
import type {
  BillingPaidAhead,
  BillingSubscription,
  BillingUsage,
} from "./_lib/billing-types";

export default function CurrentPlan({
  subscription,
  paidAhead,
  usage,
  isOwner,
  organizationId,
}: {
  subscription: BillingSubscription;
  paidAhead: BillingPaidAhead;
  usage: BillingUsage;
  isOwner: boolean;
  organizationId: string;
}) {
  const t = useTranslations("org.billing.current");
  const tStatus = useTranslations("org.billing.status");
  const tPlans = useTranslations("plans");
  const { date } = useFormatters();
  const { busy, cancel, keep } = useBillingActions(organizationId);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const plan = subscription?.plan;
  const planType = plan?.type || "STARTER";
  const status = subscription?.status;
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = statusConfig?.icon;
  const paid = !!plan && !isFreePlan(plan);

  const planName = (p: { type: string; name: string } | null | undefined) => {
    if (!p) return t("defaultPlan");
    const key = planKeyFor(p.type);
    return key ? tPlans(`plans.${key}.name`) : p.name;
  };
  const longDate = (value: Date | string) => date(value, { month: "long" });
  const end = subscription?.currentPeriodEnd ? longDate(subscription.currentPeriodEnd) : null;

  // What happens next, in one line. Ordered by what the owner most needs to know.
  const line = (() => {
    if (!subscription || !paid) return { Icon: null, tone: "", text: t("freePlan") };
    if (status === "PAST_DUE" && subscription.pastDueSince) {
      return {
        Icon: AlertTriangle,
        tone: "text-red-600 dark:text-red-400",
        text: t("pastDueSince", { date: longDate(subscription.pastDueSince) }),
      };
    }
    if (!end) return null;
    if (subscription.cancelAtPeriodEnd) {
      return { Icon: CalendarClock, tone: "text-gray-600 dark:text-gray-400", text: t("endsOn", { date: end }) };
    }
    if (subscription.pendingPlan) {
      return {
        Icon: CalendarClock,
        tone: "text-blue-700 dark:text-blue-400",
        text: t("changesOn", { plan: planName(subscription.pendingPlan), date: end }),
      };
    }
    if (subscription.pendingBillingPeriod) {
      return {
        Icon: CalendarClock,
        tone: "text-blue-700 dark:text-blue-400",
        text: t("switchesPeriodOn", { period: subscription.pendingBillingPeriod, date: end }),
      };
    }
    if (paidAhead?.periodEnd) {
      return {
        Icon: CheckCircle2,
        tone: "text-green-700 dark:text-green-400",
        text: t("paidThrough", { date: longDate(paidAhead.periodEnd) }),
      };
    }
    if (status === "TRIALING") {
      return { Icon: Clock, tone: "text-amber-600 dark:text-amber-400", text: t("trialEndsOn", { date: end }) };
    }
    return { Icon: CheckCircle2, tone: "", text: t("paidUntil", { date: end }) };
  })();

  // A scheduled change can be undone; a paid plan can be set to end, unless
  // the next period is already paid (the server refuses that too).
  const canKeep = !!subscription && (subscription.cancelAtPeriodEnd || !!subscription.pendingPlan || !!subscription.pendingBillingPeriod);
  const canCancel = !!subscription && paid && !subscription.cancelAtPeriodEnd && !paidAhead;
  const cancelsNow = status === "PAST_DUE";

  return (
    <Card className={statusConfig?.cardBorder ? `border ${statusConfig.cardBorder}` : undefined}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t("title")}
              <Badge className={PLAN_COLORS[planType]}>{planName(plan)}</Badge>
              {statusConfig && (
                <Badge className={statusConfig.badge}>
                  {StatusIcon && <StatusIcon className="h-3 w-3 me-1" />}
                  {tStatus(statusConfig.badgeLabelKey)}
                </Badge>
              )}
            </CardTitle>
            {line && (
              <CardDescription className="mt-1">
                <span className={`flex items-center gap-1 ${line.tone}`}>
                  {line.Icon && <line.Icon className="h-3.5 w-3.5 shrink-0" />}
                  {line.text}
                </span>
              </CardDescription>
            )}
          </div>

          {isOwner && (canKeep || canCancel) && (
            <div className="flex items-center gap-2">
              {canKeep && (
                <Button variant="outline" className="cursor-pointer" onClick={keep} disabled={busy !== null}>
                  {busy === "keep" && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t("keep")}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground"
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy !== null}
                >
                  {busy === "cancel" && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t("cancel")}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <UsageBar icon={Car} label={t("carListings")} current={usage.carCount} limit={plan?.maxCars ?? 0} />
          <UsageBar icon={Users} label={t("teamMembers")} current={usage.memberCount} limit={plan?.maxMembers ?? 0} />
          <UsageBar icon={Calendar} label={t("testDrives")} current={usage.testDriveCount} limit={-1} />
        </div>
      </CardContent>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelDialogTitle", { plan: planName(plan) })}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelsNow || !end
                ? t("cancelDialogBodyNow")
                : t("cancelDialogBody", { plan: planName(plan), date: end })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("cancelDialogKeep")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                setConfirmCancel(false);
                cancel();
              }}
            >
              {t("cancelDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
