"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const planDetails = {
  STARTER: {
    name: "Starter",
    description: "Perfect for small dealerships just getting started",
    features: [
      { name: "Up to 10 car listings", included: true },
      { name: "Up to 3 team members", included: true },
      { name: "90 days audit log retention", included: true },
      { name: "Email support", included: true },
      { name: "AI-powered car analysis", included: false },
      { name: "Priority support", included: false },
      { name: "Custom integrations", included: false },
    ],
    color: "border-gray-200 dark:border-gray-700",
  },
  PRO: {
    name: "Pro",
    description: "Best for growing dealerships with larger inventory",
    features: [
      { name: "Up to 50 car listings", included: true },
      { name: "Up to 10 team members", included: true },
      { name: "1 year audit log retention", included: true },
      { name: "Priority email support", included: true },
      { name: "AI-powered car analysis", included: true },
      { name: "Priority support", included: false },
      { name: "Custom integrations", included: false },
    ],
    color: "border-blue-500",
    badge: "Popular",
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "For large dealerships with unlimited needs",
    features: [
      { name: "Unlimited car listings", included: true },
      { name: "Unlimited team members", included: true },
      { name: "Unlimited audit log retention", included: true },
      { name: "24/7 priority support", included: true },
      { name: "AI-powered car analysis", included: true },
      { name: "Priority support", included: true },
      { name: "Custom integrations", included: true },
    ],
    color: "border-purple-500",
  },
};

export default function PlanComparison({ plans, currentPlanId, isOwner, organizationId }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Available Plans</h2>
        <p className="text-sm text-muted-foreground">
          Compare plans and choose the one that fits your needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const details = planDetails[plan.type];
          const isCurrentPlan = plan.id === currentPlanId || (!currentPlanId && plan.type === "STARTER");
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${details.color} ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
            >
              {details.badge && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600">
                  {details.badge}
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-2 right-4" variant="outline">
                  Current Plan
                </Badge>
              )}

              <CardHeader>
                <CardTitle>{details.name}</CardTitle>
                <CardDescription>{details.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {details.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isOwner ? (
                  isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      variant={plan.type === "PRO" ? "default" : "outline"}
                    >
                      {plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </Button>
                  )
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Contact Owner to Change
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
