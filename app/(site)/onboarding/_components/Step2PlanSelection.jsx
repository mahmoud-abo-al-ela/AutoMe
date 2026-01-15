"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const planDetails = {
  STARTER: {
    description: "Perfect for small dealerships just getting started",
    features: [
      "Up to 10 car listings",
      "Up to 3 team members",
      "90 days audit log retention",
      "Email support",
    ],
    color: "border-gray-200 dark:border-gray-700",
  },
  PRO: {
    description: "Best for growing dealerships with larger inventory",
    features: [
      "Up to 50 car listings",
      "Up to 10 team members",
      "1 year audit log retention",
      "Priority support",
      "AI-powered car analysis",
    ],
    color: "border-blue-500",
    badge: "Recommended",
  },
  ENTERPRISE: {
    description: "For large dealerships with unlimited needs",
    features: [
      "Unlimited car listings",
      "Unlimited team members",
      "Unlimited audit log retention",
      "24/7 priority support",
      "AI-powered car analysis",
      "Custom integrations",
    ],
    color: "border-purple-500",
  },
};

export default function Step2PlanSelection({
  plans,
  formData,
  updateFormData,
  onNext,
  onPrev,
}) {
  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const handleSelectPlan = (planId) => {
    updateFormData({ planId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Choose Your Plan</h2>
          <p className="text-sm text-muted-foreground">
            Select the plan that best fits your needs. You can upgrade anytime.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const details = planDetails[plan.type];
          const isSelected = formData.planId === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-md",
                details.color,
                isSelected && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {details.badge && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600">
                  {details.badge}
                </Badge>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isSelected && (
                    <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </CardTitle>
                <CardDescription>{details.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-2xl font-bold">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /month
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {details.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!formData.planId}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
