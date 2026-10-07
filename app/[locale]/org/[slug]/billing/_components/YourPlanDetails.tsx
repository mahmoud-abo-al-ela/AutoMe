"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { UsageMeter } from "./PlanColumn";
import { useBillingActions } from "./use-billing-actions";
import type { usePlanStatus } from "./use-plan-status";
import type { BillingPlan, BillingUsage } from "./_lib/billing-types";

const TONE = {
  neutral: "text-muted-foreground",
  good: "text-positive",
  warning: "text-[#8a5e00]",
  danger: "text-destructive",
  info: "text-[#1d4e9e]",
} as const;

/**
 * What sits inside the dealer's own plan column: where the plan stands, how
 * much of it they use, and — for owners — undoing a scheduled change or
 * ending the plan.
 */
export function YourPlanDetails({
  status,
  plan,
  usage,
  isOwner,
  organizationId,
}: {
  status: ReturnType<typeof usePlanStatus>;
  /** The plan whose column this is: the subscription's, or Starter when there is none. */
  plan: BillingPlan;
  usage: BillingUsage;
  isOwner: boolean;
  organizationId: string;
}) {
  const t = useTranslations("org.billing.current");
  const tUsage = useTranslations("org.billing.plans.usage");
  const { number } = useFormatters();
  const { busy, cancel, keep } = useBillingActions(organizationId);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <>
      {status.line && <p className={cn("text-caption font-semibold", TONE[status.line.tone])}>{status.line.text}</p>}

      <div className="flex flex-col gap-2.5 rounded-control bg-background p-3">
        <UsageMeter label={tUsage("cars")} current={usage.carCount} limit={plan.maxCars} />
        <UsageMeter label={tUsage("people")} current={usage.memberCount} limit={plan.maxMembers} />
        <p className="text-micro text-muted-foreground">{tUsage("testDrives", { count: usage.testDriveCount, value: number(usage.testDriveCount) })}</p>
      </div>

      {isOwner && (status.canKeep || status.canCancel) && (
        <div className="flex flex-wrap gap-2">
          {status.canKeep && (
            <Button variant="outline-strong" size="control" className="h-11 flex-1 border bg-field" onClick={keep} disabled={busy !== null}>
              {busy === "keep" && <Loader2 aria-hidden className="animate-spin" />}
              {t("keep")}
            </Button>
          )}
          {status.canCancel && (
            <Button
              variant="ghost"
              size="control"
              className="h-11 text-muted-foreground"
              onClick={() => setConfirmCancel(true)}
              disabled={busy !== null}
            >
              {busy === "cancel" && <Loader2 aria-hidden className="animate-spin" />}
              {t("cancel")}
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelDialogTitle", { plan: status.currentName })}</AlertDialogTitle>
            <AlertDialogDescription>
              {status.cancelsNow || !status.end
                ? t("cancelDialogBodyNow")
                : t("cancelDialogBody", { plan: status.currentName, date: status.end })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("cancelDialogKeep")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
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
    </>
  );
}
