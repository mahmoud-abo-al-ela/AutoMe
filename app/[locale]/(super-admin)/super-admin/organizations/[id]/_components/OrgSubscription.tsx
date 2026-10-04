"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
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
import { formatPlanAmount } from "@/lib/utils/currency";
import { planDisplayName } from "@/components/Pricing/pricing-plans";

export default function OrgSubscription({
  subscription,
  plans,
  orgId,
}: {
  subscription: OrganizationDetail["subscription"];
  plans: Plan[];
  orgId: string;
}) {
  const t = useTranslations("superAdmin.organizations.details.subscription");
  const tCommon = useTranslations("superAdmin.common");
  const tStatus = useTranslations("org.billing.status");
  const tPlans = useTranslations("plans");
  const planName = (plan: Plan) => planDisplayName(tPlans, plan);
  const actionError = useActionError();
  const { date: fmtDate, locale } = useFormatters();
  const amount = (minor: number) => formatPlanAmount(minor, locale);
  const planOption = (plan: Plan) =>
    tCommon("planOption", { name: planName(plan), amount: amount(plan.monthlyPrice) });
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
        toast.success(t("updated"), {
          description: newPlan
            ? t("updatedBody", { plan: planName(newPlan) })
            : undefined,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("updateFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
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
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">
                  {currentPlan ? planName(currentPlan) : null}
                </span>
                <Badge
                  variant={
                    subscription.status === "ACTIVE"
                      ? "default"
                      : subscription.status === "TRIALING"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {tStatus(subscription.status)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {tCommon("perMonth", {
                  amount: amount(currentPlan?.monthlyPrice ?? 0),
                })}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("periodStart")}</span>
                <span>
                  {subscription.currentPeriodStart
                    ? fmtDate(new Date(subscription.currentPeriodStart))
                    : tCommon("notAvailable")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("periodEnd")}</span>
                <span>
                  {subscription.currentPeriodEnd
                    ? fmtDate(new Date(subscription.currentPeriodEnd))
                    : tCommon("notAvailable")}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label
                htmlFor="changePlan"
                className="text-sm font-medium mb-2 block"
              >
                {t("changePlan")}
              </label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="changePlan">
                  <SelectValue placeholder={t("selectPlan")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {planOption(plan)}
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
                    {t("updating")}
                  </>
                ) : (
                  t("update")
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">{t("none")}</p>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger aria-label={t("assignPlaceholder")}>
                <SelectValue placeholder={t("assignPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {planOption(plan)}
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
                  {t("assigning")}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {t("assign")}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
