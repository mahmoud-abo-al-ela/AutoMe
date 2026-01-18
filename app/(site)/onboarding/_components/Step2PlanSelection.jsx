"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, CreditCard, Sparkles, TrendingUp, Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { planSelectionSchema } from "./schemas";

const PLAN_CONFIG = {
  STARTER: { icon: Sparkles, color: "text-gray-600", border: "border-gray-200" },
  PRO: { icon: TrendingUp, color: "text-blue-600", border: "border-blue-500", badge: "Most Popular" },
  ENTERPRISE: { icon: Crown, color: "text-purple-600", border: "border-purple-500" },
};

export default function Step2PlanSelection({
  plans,
  formData,
  updateFormData,
  onNext,
  onPrev,
}) {
  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSelectionSchema),
    mode: "onChange",
    defaultValues: {
      planId: formData.planId || "",
    },
  });

  const selectedPlanId = watch("planId");

  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const getFeatures = (plan) => {
    const f = plan.features || {};
    const features = [];

    features.push({ name: plan.maxCars === -1 ? "Unlimited car listings" : `${plan.maxCars} car listings`, included: true });
    features.push({ name: plan.maxMembers === -1 ? "Unlimited team members" : `${plan.maxMembers} team members`, included: true });
    features.push({ name: `${plan.maxImagesPerCar} images per car`, included: true });
    features.push({ name: plan.auditLogRetentionDays === null ? "Unlimited audit logs" : `${plan.auditLogRetentionDays} days audit logs`, included: true });

    Object.entries(f).forEach(([key, value]) => {
      if (key === 'analytics' || key === 'whiteLabel' || key === 'webhooks' || key === 'description' || key === 'featureList' || key === 'color' || key === 'badge') return;
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

  const handleSelectPlan = (planId) => {
    setValue("planId", planId, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    updateFormData(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        </div>
        <p className="text-muted-foreground">
          Select the perfect plan for your dealership. You can upgrade anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
          const Icon = config.icon;
          const isSelected = selectedPlanId === plan.id;
          const isPro = plan.type === "PRO";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all duration-300 hover:shadow-lg mt-6",
                config.border,
                isSelected && "ring-2 ring-green-500 shadow-md",
                isPro && !isSelected && "scale-105 z-10"
              )}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {config.badge && !isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
                    {config.badge}
                  </Badge>
                </div>
              )}
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-green-500 hover:bg-green-500/90 text-white px-3 py-1">
                    Selected
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-2 rounded-lg bg-background/80", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <div className="pt-2">
                  {plan.monthlyPrice === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
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
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  type="button"
                  className="w-full"
                  variant={isSelected ? "default" : isPro ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    `Select ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {errors.planId && (
        <p className="text-sm text-destructive text-center">
          {errors.planId.message}
        </p>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          All plans include secure data storage and email support.{" "}
          <a href="mailto:sales@autome.com" className="text-primary hover:underline">
            Contact sales
          </a>{" "}
          for custom solutions.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={!selectedPlanId} data-continue-btn className="cursor-pointer">
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
