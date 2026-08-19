"use client";

import { useState, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
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
import { createPlanChangeSession } from "@/actions/billing";
import { PLAN_CONFIG, formatPrice, getFeatures } from "./_lib/plan-display";
import PlanCard from "./PlanCard";
import FeatureComparisonTable from "./FeatureComparisonTable";
import type { BillingPlan } from "./_lib/billing-types";

export default function PlanComparison({
  plans,
  currentPlanId,
  isOwner,
  organizationId,
}: {
  plans: BillingPlan[];
  currentPlanId: string | null | undefined;
  isOwner: boolean;
  organizationId: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const handlePlanChange = async () => {
    if (!selectedPlan) return;
    setIsChanging(true);
    try {
      const result = await createPlanChangeSession(
        organizationId,
        selectedPlan.id,
        billingCycle,
        pathname
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to change plan.");
      }

      if (result.data.type === "redirect") {
        // The action only returns this branch with a url present.
        window.location.href = result.data.url!;
      } else if (result.data.type === "updated") {
        toast.success(`Successfully switched to ${selectedPlan.name} plan!`);
        setIsDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to change plan:", error);
      toast.error(
        (error instanceof Error && error.message) ||
          "Failed to change plan. Please try again."
      );
      setIsChanging(false);
    }
  };

  return (
    <>
      <div className="space-y-6" id="plans">
        {/* Header section */}
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground mt-2">
              Select the perfect plan for your dealership
            </p>
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
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="cursor-pointer">
                  Yearly
                  {averageSavings > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100">
                      Save {averageSavings}%
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
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3 cursor-pointer"
                onClick={() => setViewMode("table")}
              >
                <TableProperties className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Compare</span>
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
                  plan.id === currentPlanId ||
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
                  plan.id === currentPlanId ||
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
            All plans include secure data storage and email support.{" "}
            <a
              href="mailto:sales@autome.com"
              className="text-primary hover:underline"
            >
              Contact sales
            </a>{" "}
            for custom solutions.
          </p>
        </div>
      </div>

      {/* Plan change confirmation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Switch to <strong>{selectedPlan?.name}</strong> plan
              {selectedPlan && getDisplayPrice(selectedPlan) > 0 && (
                <>
                  {" "}
                  for{" "}
                  <strong>
                    {formatPrice(getDisplayPrice(selectedPlan))}/
                    {billingCycle === "yearly" ? "year" : "month"}
                  </strong>
                </>
              )}
              ?
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Included features:</p>
              <ul className="space-y-1 text-sm">
                {getFeatures(selectedPlan)
                  .filter((f) => f.included)
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      {f.name}
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
              Cancel
            </Button>
            <Button
              onClick={handlePlanChange}
              disabled={isChanging}
              className="cursor-pointer"
            >
              {isChanging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
