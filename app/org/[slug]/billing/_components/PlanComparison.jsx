"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Sparkles,
  TrendingUp,
  Crown,
  Loader2,
  LayoutGrid,
  TableProperties,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPlanChangeSession } from "@/actions/billing";

const PLAN_CONFIG = {
  STARTER: {
    icon: Sparkles,
    color: "text-gray-600",
    border: "border-gray-200",
  },
  PRO: {
    icon: TrendingUp,
    color: "text-blue-600",
    border: "border-blue-500",
    badge: "Most Popular",
  },
  ENTERPRISE: {
    icon: Crown,
    color: "text-purple-600",
    border: "border-purple-500",
  },
};

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);
}

function formatFeatureName(key) {
  const nameMap = {
    aiProcessing: "AI Processing",
    chat: "Live Chat",
    prioritySupport: "Priority Support",
  };
  return (
    nameMap[key] ||
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

function getFeatures(plan) {
  const f = plan.features || {};
  const features = [];

  features.push({
    name:
      plan.maxCars === -1
        ? "Unlimited car listings"
        : `${plan.maxCars} car listings`,
    included: true,
  });
  features.push({
    name:
      plan.maxMembers === -1
        ? "Unlimited team members"
        : `${plan.maxMembers} team members`,
    included: true,
  });
  features.push({
    name: `${plan.maxImagesPerCar} images per car`,
    included: true,
  });
  features.push({
    name:
      plan.auditLogRetentionDays === null
        ? "Unlimited audit logs"
        : `${plan.auditLogRetentionDays} days audit logs`,
    included: true,
  });

  Object.entries(f).forEach(([key, value]) => {
    if (key === "analytics" || key === "whiteLabel" || key === "webhooks")
      return;
    if (typeof value === "object" && value !== null && "enabled" in value) {
      features.push({
        name: formatFeatureName(key),
        included: !!value.enabled,
      });
    } else if (typeof value === "boolean") {
      features.push({ name: formatFeatureName(key), included: value });
    }
  });

  return features;
}

/**
 * Collect all unique feature names across all plans for the comparison table
 */
function getAllFeatureNames(plans) {
  const featureSet = new Set();
  plans.forEach((plan) => {
    getFeatures(plan).forEach((f) => featureSet.add(f.name));
  });
  return Array.from(featureSet);
}

/**
 * Build a lookup: featureName -> boolean for a given plan
 */
function getFeatureLookup(plan) {
  const lookup = {};
  getFeatures(plan).forEach((f) => {
    lookup[f.name] = f.included;
  });
  return lookup;
}

function PlanCard({
  plan,
  config,
  isCurrent,
  isPro,
  displayPrice,
  savings,
  billingCycle,
  isOwner,
  onSelect,
}) {
  const Icon = config.icon;

  return (
    <Card
      className={`relative transition-all duration-300 hover:shadow-lg mt-6 min-w-[280px] snap-center ${isCurrent ? "ring-2 ring-green-600 shadow-md" : config.border
        } ${isPro && !isCurrent ? "md:scale-105 md:z-10" : ""}`}
    >
      {config.badge && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
            {config.badge}
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg bg-background/80 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
        </div>
        <div className="pt-2">
          {displayPrice === 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">Free</span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-muted-foreground text-sm">
                  /{billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              {billingCycle === "yearly" && savings > 0 && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Save {savings}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <ul className="space-y-2.5">
          {getFeatures(plan).map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={feature.included ? "" : "text-muted-foreground"}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isOwner ? (
          isCurrent ? (
            <Button className="w-full" variant="outline" disabled>
              <Check className="h-4 w-4 mr-2" />
              Current Plan
            </Button>
          ) : (
            <Button
              className="cursor-pointer w-full"
              variant={isPro ? "default" : "outline"}
              onClick={() => onSelect(plan)}
            >
              Switch to {plan.name}
            </Button>
          )
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Only Owner Can Change
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FeatureComparisonTable({
  plans,
  currentPlanId,
  billingCycle,
  isOwner,
  onSelectPlan,
}) {
  const allFeatures = getAllFeatureNames(plans);
  const getDisplayPrice = (plan) =>
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="min-w-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 bg-background z-10">
                Feature
              </TableHead>
              {plans.map((plan) => {
                const isCurrent =
                  plan.id === currentPlanId ||
                  (!currentPlanId && plan.type === "STARTER");
                const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
                const Icon = config.icon;

                return (
                  <TableHead key={plan.id} className="text-center min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-semibold">{plan.name}</span>
                      </div>
                      <span className="text-xs font-normal text-muted-foreground">
                        {getDisplayPrice(plan) === 0
                          ? "Free"
                          : `${formatPrice(getDisplayPrice(plan))}/${billingCycle === "yearly" ? "yr" : "mo"
                          }`}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500 text-green-600"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allFeatures.map((featureName) => (
              <TableRow key={featureName}>
                <TableCell className="font-medium text-sm sticky left-0 bg-background z-10">
                  {featureName}
                </TableCell>
                {plans.map((plan) => {
                  const lookup = getFeatureLookup(plan);
                  const included = lookup[featureName] ?? false;

                  return (
                    <TableCell key={plan.id} className="text-center">
                      {included ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {/* Action row */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background z-10" />
              {plans.map((plan) => {
                const isCurrent =
                  plan.id === currentPlanId ||
                  (!currentPlanId && plan.type === "STARTER");
                const isPro = plan.type === "PRO";

                return (
                  <TableCell key={plan.id} className="text-center">
                    {isOwner ? (
                      isCurrent ? (
                        <Button size="sm" variant="outline" disabled>
                          <Check className="h-3 w-3 mr-1" />
                          Current
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={isPro ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => onSelectPlan(plan)}
                        >
                          Select
                        </Button>
                      )
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Owner Only
                      </Button>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function PlanComparison({
  plans,
  currentPlanId,
  isOwner,
  organizationId,
}) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const pathname = usePathname();
  const scrollRef = useRef(null);

  const getDisplayPrice = (plan) =>
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const getSavingsPercent = (plan) =>
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
    const totalSavings = paidPlans.reduce((sum, plan) => {
      const monthlyTotal = plan.monthlyPrice * 12;
      const yearlyPrice = plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
      const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
      return sum + savings;
    }, 0);
    return Math.round(totalSavings / paidPlans.length);
  })();

  const handleSelectPlan = (plan) => {
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

      if (result.type === "redirect") {
        window.location.href = result.url;
      } else if (result.type === "updated") {
        toast.success(`Successfully switched to ${selectedPlan.name} plan!`);
        setIsDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to change plan:", error);
      toast.error(error.message || "Failed to change plan. Please try again.");
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
              onValueChange={setBillingCycle}
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

