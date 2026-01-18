"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Car, Users, ArrowUpRight } from "lucide-react";

const planColors = {
  STARTER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ENTERPRISE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function CurrentPlan({ subscription, usage, isOwner }) {
  const plan = subscription?.plan;
  const planType = plan?.type || "STARTER";

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getUsagePercent = (current, limit) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <Badge className={planColors[planType]}>{plan?.name || "Starter"}</Badge>
            </CardTitle>
            <CardDescription>
              {subscription?.status === "TRIALING" && (
                <span className="text-amber-600 dark:text-amber-400">
                  Trial ends on {formatDate(subscription.trialEnd)}
                </span>
              )}
              {subscription?.status === "ACTIVE" &&
                subscription.currentPeriodEnd && (
                  <span>
                    Renews on {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
              {!subscription && <span>You're on the free Starter plan</span>}
            </CardDescription>
          </div>
          {isOwner && planType !== "ENTERPRISE" && (
            <Button>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cars Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4" />
                <span>Car Listings</span>
              </div>
              <span className="font-medium">
                {usage.carCount}
                {plan?.maxCars !== -1 ? ` / ${plan?.maxCars || 0}` : ""}
              </span>
            </div>
            {plan?.maxCars !== -1 ? (
              <Progress
                value={getUsagePercent(usage.carCount, plan?.maxCars || 0)}
                className="h-2"
              />
            ) : (
              <Badge variant="outline" className="text-xs">
                Unlimited
              </Badge>
            )}
          </div>

          {/* Team Members Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team Members</span>
              </div>
              <span className="font-medium">
                {usage.memberCount}
                {plan?.maxMembers !== -1 ? ` / ${plan?.maxMembers || 0}` : ""}
              </span>
            </div>
            {plan?.maxMembers !== -1 ? (
              <Progress
                value={getUsagePercent(usage.memberCount, plan?.maxMembers || 0)}
                className="h-2"
              />
            ) : (
              <Badge variant="outline" className="text-xs">
                Unlimited
              </Badge>
            )}
          </div>

          {/* Test Drives This Month */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Test Drives (This Month)</span>
              </div>
              <span className="font-medium">{usage.testDriveCount}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Unlimited
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
