"use client";
import { useFormatters } from "@/hooks/use-formatters";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { CreditCard, Calendar, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { changeOrganizationPlan } from "@/actions/super-admin";
import type { Plan } from "@/lib/generated/prisma";
import type { OrganizationDetail } from "./OrgDetailsHeader";

export default function OrgSubscription({
  subscription,
  plans,
  orgId,
}: {
  subscription: OrganizationDetail["subscription"];
  plans: Plan[];
  orgId: string;
}) {
  const { date: fmtDate } = useFormatters();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState(subscription?.planId || "");
  const [loading, setLoading] = useState(false);

  const handleChangePlan = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const result = await changeOrganizationPlan(orgId, selectedPlan);
      const newPlan = plans.find((p) => p.id === selectedPlan);
      if (result.success) {
        toast.success("Plan updated successfully", {
          description: `Subscription changed to ${
            newPlan?.name || "new plan"
          }.`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to update plan", {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = subscription?.plan;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{currentPlan?.name}</span>
                <Badge
                  variant={
                    subscription.status === "ACTIVE"
                      ? "default"
                      : subscription.status === "TRIALING"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {/* currentPlan comes from a find() and can be undefined, in
                    which case this has always rendered "$NaN". Cast rather
                    than defaulted, so that pre-existing path is unchanged. */}
                ${((currentPlan?.monthlyPrice as number) / 100).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Period Start</span>
                <span>
                  {subscription.currentPeriodStart
                    ? fmtDate(new Date(subscription.currentPeriodStart))
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Period End</span>
                <span>
                  {subscription.currentPeriodEnd
                    ? fmtDate(new Date(subscription.currentPeriodEnd))
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm font-medium mb-2 block">
                Change Plan
              </label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${(plan.monthlyPrice / 100).toFixed(0)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full mt-2"
                onClick={handleChangePlan}
                disabled={
                  loading || isPending || selectedPlan === subscription.planId
                }
              >
                {loading || isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Plan"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No subscription</p>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Assign a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${(plan.monthlyPrice / 100).toFixed(0)}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full mt-2"
              onClick={handleChangePlan}
              disabled={loading || isPending || !selectedPlan}
            >
              {loading || isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  Assign Plan
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
