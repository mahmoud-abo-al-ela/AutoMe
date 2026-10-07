"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePlan } from "@/actions/billing";
import { formatPlanPrice, planFeatureKeys, planKeyFor } from "@/components/Pricing/pricing-plans";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { isFreePlan, planChange } from "@/lib/utils/plan-change";
import type { BillingCycle } from "./PlanColumn";
import type { BillingPaidAhead, BillingPlan, BillingSubscription } from "./_lib/billing-types";

/**
 * Confirms a plan change and says exactly what it does — pay now, wait for
 * the paid period to end, or switch at once — by the same rule the server
 * applies (lib/utils/plan-change). Paying goes on to Paymob's checkout.
 */
export function PlanChangeDialog({
  plan,
  cycle,
  subscription,
  paidAhead,
  organizationId,
  onClose,
}: {
  plan: BillingPlan | null;
  cycle: BillingCycle;
  subscription: BillingSubscription;
  paidAhead: BillingPaidAhead;
  organizationId: string;
  onClose: () => void;
}) {
  const t = useTranslations("org.billing.plans");
  const tPlans = useTranslations("plans");
  const tCommon = useTranslations("common.actions");
  const actionError = useActionError();
  const { number, locale, date } = useFormatters();
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  const key = planKeyFor(plan?.type);
  const name = key ? tPlans(`plans.${key}.name`) : (plan?.name ?? "");
  const period = cycle === "yearly" ? "YEARLY" : "MONTHLY";
  const change = plan ? planChange(subscription, plan, period) : "none";
  const periodEnd = subscription?.currentPeriodEnd ? date(subscription.currentPeriodEnd, { month: "long" }) : "";
  const price = plan ? (formatPlanPrice(plan, cycle, locale) ?? "") : "";

  const confirm = async () => {
    if (!plan) return;
    setChanging(true);
    try {
      const result = await changePlan(organizationId, plan.id, cycle, locale);
      if (!result.success) {
        toast.error(actionError(result.error, t("changeFailed")));
        setChanging(false);
        return;
      }
      if (result.data.type === "redirect") {
        // To Paymob's checkout; the change applies once the payment does.
        window.location.href = result.data.url;
        return;
      }
      toast.success(
        result.data.type === "scheduled" && result.data.effectiveAt
          ? t("scheduledToast", { plan: name, date: date(result.data.effectiveAt, { month: "long" }) })
          : t("switched", { plan: name }),
      );
      setChanging(false);
      onClose();
      router.refresh();
    } catch {
      // A thrown error is a network or framework failure; its message is
      // English and technical, so the reader gets the translated one.
      toast.error(t("changeFailed"));
      setChanging(false);
    }
  };

  const b = (chunks: ReactNode) => <strong>{chunks}</strong>;
  const free = plan ? isFreePlan(plan) : false;
  const body = (() => {
    switch (change) {
      case "none":
        return t("dialogNone", { plan: name });
      case "pay":
        return t.rich("dialogPay", { plan: name, price, period, b });
      case "schedule":
        return free
          ? t.rich("dialogScheduleFree", { plan: name, date: periodEnd, b })
          : t.rich("dialogSchedule", { plan: name, price, period, date: periodEnd, b });
      case "apply":
        return free ? t.rich("dialogApplyFree", { plan: name, b }) : t.rich("dialogApplyTrial", { price, period, b });
    }
  })();

  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && !changing && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeTo", { plan: name })}</DialogTitle>
          <DialogDescription>
            {body}
            {paidAhead && change !== "none" && <span className="mt-2 block text-[#8a5e00]">{t("dialogPaidAhead")}</span>}
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <div className="rounded-control bg-muted p-4">
            <p className="mb-2 text-caption font-semibold">{t("includedFeatures")}</p>
            <ul className="flex flex-col gap-1 text-caption">
              {planFeatureKeys(plan)
                .filter((feature) => feature.included)
                .map((feature) => (
                  <li key={feature.key} className="flex items-center gap-2">
                    <Check aria-hidden className="size-3.5 text-positive" />
                    {tPlans(
                      `features.${feature.key}`,
                      feature.params ? { count: feature.params.count, value: number(feature.params.count) } : undefined,
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline-strong" size="control" className="h-11 border bg-field" onClick={onClose} disabled={changing}>
            {tCommon("cancel")}
          </Button>
          {/* Nothing to confirm when already on it, or when the next period
              is paid (the server refuses those changes too). */}
          <Button variant="inverse" size="control" className="h-11" onClick={confirm} disabled={changing || change === "none" || !!paidAhead}>
            {changing && <Loader2 aria-hidden className="animate-spin" />}
            {changing ? t("processing") : change === "pay" ? t("goToPayment") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
