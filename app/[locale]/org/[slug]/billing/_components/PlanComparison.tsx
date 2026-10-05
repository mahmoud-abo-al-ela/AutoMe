"use client";

import { useState, useRef, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, LayoutGrid, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { changePlan } from "@/actions/billing";
import { isFreePlan, planChange } from "@/lib/utils/plan-change";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { PLAN_CONFIG } from "./_lib/plan-display";
import {
  planFeatureKeys,
  planKeyFor,
  formatPlanPrice,
} from "@/components/Pricing/pricing-plans";
import PlanCard from "./PlanCard";
import FeatureComparisonTable from "./FeatureComparisonTable";
import type { BillingPaidAhead, BillingPlan, BillingSubscription } from "./_lib/billing-types";

export default function PlanComparison({
  plans,
  subscription,
  paidAhead,
  isOwner,
  organizationId,
}: {
  plans: BillingPlan[];
  subscription: BillingSubscription;
  paidAhead: BillingPaidAhead;
  isOwner: boolean;
  organizationId: string;
}) {
  const currentPlanId = subscription?.planId;
  const t = useTranslations("org.billing.plans");
  const tPlans = useTranslations("plans");
  const tCommon = useTranslations("common.actions");
  const actionError = useActionError();
  const { number, locale, date } = useFormatters();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // The dialog names the plan; a DB plan with an unrecognised type falls back
  // to its untranslated name rather than rendering blank.
  const selectedPlanKey = planKeyFor(selectedPlan?.type);
  const selectedPlanName = selectedPlanKey
    ? tPlans(`plans.${selectedPlanKey}.name`)
    : (selectedPlan?.name ?? "");

  const getDisplayPrice = (plan: BillingPlan) =>
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const getSavingsPercent = (plan: BillingPlan) =>
    plan.monthlyPrice === 0 || plan.yearlyPrice === 0
      ? 0
      : Math.round(
        (1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100
      );

  // Compute average yearly savings percentage across paid plans (matches home page)
  const averageSavings = (() => {
    const paidPlans = plans.filter(
      (plan) => plan.monthlyPrice > 0 && plan.monthlyPrice !== null
    );
    if (paidPlans.length === 0) return 0;
    const totalSavings = paidPlans.reduce((sum: number, plan) => {
      const monthlyTotal = plan.monthlyPrice * 12;
      const yearlyPrice = plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
      const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
      return sum + savings;
    }, 0);
    return Math.round(totalSavings / paidPlans.length);
  })();

  const handleSelectPlan = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  // What confirming would do: the same rule the server applies.
  const period = billingCycle === "yearly" ? "YEARLY" : "MONTHLY";
  const change = selectedPlan ? planChange(subscription, selectedPlan, period) : "none";
  const periodEnd = subscription?.currentPeriodEnd
    ? date(subscription.currentPeriodEnd, { month: "long" })
    : "";
  const selectedPrice = selectedPlan
    ? formatPlanPrice(selectedPlan, billingCycle, locale) ?? ""
    : "";

  const handlePlanChange = async () => {
    if (!selectedPlan) return;
    setIsChanging(true);
    try {
      const result = await changePlan(organizationId, selectedPlan.id, billingCycle, locale);

      if (!result.success) {
        toast.error(actionError(result.error, t("changeFailed")));
        setIsChanging(false);
        return;
      }

      if (result.data.type === "redirect") {
        // To Paymob's checkout; the change applies once the payment does.
        window.location.href = result.data.url;
        return;
      }
      toast.success(
        result.data.type === "scheduled" && result.data.effectiveAt
          ? t("scheduledToast", {
              plan: selectedPlanName,
              date: date(result.data.effectiveAt, { month: "long" }),
            })
          : t("switched", { plan: selectedPlanName })
      );
      setIsDialogOpen(false);
      setIsChanging(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to change plan:", error);
      // A thrown error is a network or framework failure; its message is
      // English and technical, so the reader gets the translated one.
      toast.error(t("changeFailed"));
      setIsChanging(false);
    }
  };

  return (
    <>
      <div className="space-y-6" id="plans">
        {/* Header section */}
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>

          {/* Controls row: billing toggle + view mode */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Tabs
              value={billingCycle}
              // Tabs hands back a plain string; only the two triggers below
              // can produce a value.
              onValueChange={(value) =>
                setBillingCycle(value as "monthly" | "yearly")
              }
              className="w-auto"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly" className="cursor-pointer">
                  {tPlans("monthly")}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="cursor-pointer">
                  {tPlans("yearly")}
                  {averageSavings > 0 && (
                    <Badge variant="secondary" className="ms-2 text-xs bg-green-100">
                      {tPlans("save", { percentage: number(averageSavings) })}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View mode toggle */}
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3 cursor-pointer"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4 me-1.5" />
                <span className="hidden sm:inline">{t("cards")}</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3 cursor-pointer"
                onClick={() => setViewMode("table")}
              >
                <TableProperties className="h-4 w-4 me-1.5" />
                <span className="hidden sm:inline">{t("compare")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Plan display */}
        {viewMode === "cards" ? (
          <>
            {/* Mobile: horizontal scroll container */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-x-visible md:snap-none md:pb-0"
            >
              {plans.map((plan) => {
                const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
                const isCurrent =
                  (plan.id === currentPlanId && (isFreePlan(plan) || period === subscription?.billingPeriod)) ||
                  (!currentPlanId && plan.type === "STARTER");
                const isPro = plan.type === "PRO";
                const displayPrice = getDisplayPrice(plan);
                const savings = getSavingsPercent(plan);

                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    config={config}
                    isCurrent={isCurrent}
                    isPro={isPro}
                    displayPrice={displayPrice}
                    savings={savings}
                    billingCycle={billingCycle}
                    isOwner={isOwner}
                    onSelect={handleSelectPlan}
                  />
                );
              })}
            </div>

            {/* Mobile scroll indicator */}
            <div className="flex justify-center gap-1.5 md:hidden">
              {plans.map((plan) => {
                const isCurrent =
                  (plan.id === currentPlanId && (isFreePlan(plan) || period === subscription?.billingPeriod)) ||
                  (!currentPlanId && plan.type === "STARTER");
                return (
                  <div
                    key={plan.id}
                    className={`h-1.5 rounded-full transition-all ${isCurrent
                      ? "w-6 bg-green-600"
                      : "w-1.5 bg-muted-foreground/30"
                      }`}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <FeatureComparisonTable
            plans={plans}
            currentPlanId={currentPlanId}
            billingCycle={billingCycle}
            isOwner={isOwner}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {t.rich("footerNote", {
              link: (chunks) => (
                <a
                  href="mailto:sales@autome.com"
                  className="text-primary hover:underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>

      {/* Plan change confirmation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changePlan")}</DialogTitle>
            <DialogDescription>
              {selectedPlan &&
                (() => {
                  const b = (chunks: ReactNode) => <strong>{chunks}</strong>;
                  const free = isFreePlan(selectedPlan);
                  switch (change) {
                    case "none":
                      return t("dialogNone", { plan: selectedPlanName });
                    case "pay":
                      return t.rich("dialogPay", { plan: selectedPlanName, price: selectedPrice, period, b });
                    case "schedule":
                      return free
                        ? t.rich("dialogScheduleFree", { plan: selectedPlanName, date: periodEnd, b })
                        : t.rich("dialogSchedule", { plan: selectedPlanName, price: selectedPrice, period, date: periodEnd, b });
                    case "apply":
                      return free
                        ? t.rich("dialogApplyFree", { plan: selectedPlanName, b })
                        : t.rich("dialogApplyTrial", { price: selectedPrice, period, b });
                  }
                })()}
              {paidAhead && change !== "none" && (
                <span className="mt-2 block text-amber-700 dark:text-amber-400">{t("dialogPaidAhead")}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">
                {t("includedFeatures")}
              </p>
              <ul className="space-y-1 text-sm">
                {planFeatureKeys(selectedPlan)
                  .filter((f) => f.included)
                  .map((f) => (
                    <li key={f.key} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      {tPlans(
                        `features.${f.key}`,
                        f.params ? { count: f.params.count, value: number(f.params.count) } : undefined
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isChanging}
              className="cursor-pointer"
            >
              {tCommon("cancel")}
            </Button>
            {/* Nothing to confirm when already on it, or when the next period
                is paid (the server refuses those changes too). */}
            <Button
              onClick={handlePlanChange}
              disabled={isChanging || change === "none" || !!paidAhead}
              className="cursor-pointer"
            >
              {isChanging ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t("processing")}
                </>
              ) : change === "pay" ? (
                t("goToPayment")
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
