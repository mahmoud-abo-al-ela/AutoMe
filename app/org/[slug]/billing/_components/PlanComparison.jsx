"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Sparkles, TrendingUp, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLAN_CONFIG = {
  STARTER: { icon: Sparkles, color: "text-gray-600", border: "border-gray-200" },
  PRO: { icon: TrendingUp, color: "text-blue-600", border: "border-blue-500", badge: "Most Popular" },
  ENTERPRISE: { icon: Crown, color: "text-purple-600", border: "border-purple-500" },
};

export default function PlanComparison({ plans, currentPlanId, isOwner, organizationId }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price / 100);
  };

  const getFeatures = (plan) => {
    const f = plan.features || {};
    const features = [];

    features.push({ name: plan.maxCars === -1 ? "Unlimited car listings" : `${plan.maxCars} car listings`, included: true });
    features.push({ name: plan.maxMembers === -1 ? "Unlimited team members" : `${plan.maxMembers} team members`, included: true });
    features.push({ name: `${plan.maxImagesPerCar} images per car`, included: true });
    features.push({ name: plan.auditLogRetentionDays === null ? "Unlimited audit logs" : `${plan.auditLogRetentionDays} days audit logs`, included: true });

    Object.entries(f).forEach(([key, value]) => {
      if (key === 'analytics' || key === 'whiteLabel' || key === 'webhooks') return;
      if (typeof value === 'object' && value !== null && 'enabled' in value) {
        features.push({ name: formatFeatureName(key), included: !!value.enabled });
      } else if (typeof value === 'boolean') {
        features.push({ name: formatFeatureName(key), included: value });
      }
    });

    return features;
  };

  const formatFeatureName = (key) => {
    const nameMap = {
      aiProcessing: "AI Processing",
      chat: "Live Chat",
      prioritySupport: "Priority Support",
    };
    return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
  };

  const getDisplayPrice = (plan) => billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const getSavingsPercent = (plan) => plan.monthlyPrice === 0 || plan.yearlyPrice === 0 ? 0 : Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100);

  const handlePlanChange = async () => {
    if (!selectedPlan) return;
    setIsChanging(true);
    try {
      toast.success(`Switched to ${selectedPlan.name} plan!`);
      setIsDialogOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(error.message || "Failed to change plan");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground mt-2">Select the perfect plan for your dealership</p>
          </div>

          <div className="flex justify-center">
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly" className="cursor-pointer">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="cursor-pointer">
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">Save up to 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
            const Icon = config.icon;
            const isCurrent = plan.id === currentPlanId || (!currentPlanId && plan.type === "STARTER");
            const isPro = plan.type === "PRO";
            const displayPrice = getDisplayPrice(plan);
            const savings = getSavingsPercent(plan);

            return (
              <Card key={plan.id} className={`relative transition-all duration-300 hover:shadow-lg mt-6 ${isCurrent ? "ring-2 ring-green-600 shadow-md" : config.border} ${isPro && !isCurrent ? "scale-105 z-10" : ""}`}>
                {config.badge && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">{config.badge}</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">Current Plan</Badge>
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
                          <span className="text-4xl font-bold">{formatPrice(displayPrice)}</span>
                          <span className="text-muted-foreground text-sm">/{billingCycle === "yearly" ? "year" : "month"}</span>
                        </div>
                        {billingCycle === "yearly" && savings > 0 && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">Save {savings}%</Badge>
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
                        <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isOwner ? (
                    isCurrent ? (
                      <Button className="w-full" variant="outline" disabled>
                        <Check className="h-4 w-4 mr-2" />Current Plan
                      </Button>
                    ) : (
                      <Button className="cursor-pointer w-full" variant={isPro ? "default" : "outline"} onClick={() => { setSelectedPlan(plan); setIsDialogOpen(true); }}>
                        Switch to {plan.name}
                      </Button>
                    )
                  ) : (
                    <Button className="w-full" variant="outline" disabled>Only Owner Can Change</Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include secure data storage and email support. <a href="mailto:sales@autome.com" className="text-primary hover:underline">Contact sales</a> for custom solutions.</p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Switch to <strong>{selectedPlan?.name}</strong> plan
              {selectedPlan && getDisplayPrice(selectedPlan) > 0 && <> for <strong>{formatPrice(getDisplayPrice(selectedPlan))}/{billingCycle === "yearly" ? "year" : "month"}</strong></>}?
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Included features:</p>
              <ul className="space-y-1 text-sm">
                {getFeatures(selectedPlan).filter(f => f.included).map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />{f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isChanging} className="cursor-pointer">Cancel</Button>            <Button onClick={handlePlanChange} disabled={isChanging} className="cursor-pointer">
              {isChanging ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
