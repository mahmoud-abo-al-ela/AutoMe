"use client";

import {
  Check,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Car,
  Users,
  Image,
  Sparkles,
  MessageSquare,
  Zap,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlanType } from "@/lib/generated/prisma";
import { useFormatters } from "@/hooks/use-formatters";
import { planDisplayName } from "@/components/Pricing/pricing-plans";
import type { PlanFeatures } from "./usePlanForm";
import type { PlanWithUsage } from "./PlansGrid";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { formatPlanAmount } from "@/lib/utils/currency";

const planColors: Record<PlanType, string> = {
  STARTER: "border-gray-200 dark:border-gray-700",
  PRO: "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800",
  ENTERPRISE: "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800",
};

export default function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: PlanWithUsage;
  onEdit: (plan: PlanWithUsage) => void;
  onDelete: (plan: PlanWithUsage) => void;
}) {
  const t = useTranslations("superAdmin.plans.card");
  const tCommon = useTranslations("superAdmin.common");
  // Plan names, limits and feature names are shared with the public pricing
  // cards, so a tier reads the same on both sides.
  const tPlans = useTranslations("plans");
  const { number, locale } = useFormatters();
  const amount = (minor: number) => formatPlanAmount(minor, locale);

  // Plan.features is a Json column; the shape is only written by the plan form.
  const features = (plan.features as Partial<PlanFeatures> | null) || {};

  const allFeatures = [
    { key: "aiProcessing", label: tPlans("features.aiProcessing"), icon: Sparkles, enabled: features.aiProcessing?.enabled || false },
    { key: "chat", label: tPlans("features.liveChat"), icon: MessageSquare, enabled: features.chat || false },
    { key: "prioritySupport", label: tPlans("features.prioritySupport"), icon: Zap, enabled: features.prioritySupport || false },
  ];

  return (
    <Card className={`relative ${planColors[plan.type] || ""}`}>
      {plan.type === "PRO" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-500 hover:bg-blue-600">
            {tPlans("mostPopular")}
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {/* The shared name for the type, as on the pricing page, so the
                card reads in the admin's language. The stored name is only a
                fallback for an unknown type. */}
            <CardTitle className="text-xl">{planDisplayName(tPlans, plan)}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tCommon("actions")}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Pencil className="h-4 w-4 me-2" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(plan)}
              >
                <Trash2 className="h-4 w-4 me-2" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {amount(plan.monthlyPrice)}
          </span>
          <span className="text-muted-foreground"> {tPlans("perMonth")}</span>
          {plan.monthlyPrice > 0 && plan.yearlyPrice > 0 && (
            <div className="text-sm text-muted-foreground">
              {/* This printed a dollar sign before. Plans are priced in EGP,
                  so the yearly figure goes through the same formatter. */}
              {t("orYearly", {
                amount: amount(plan.yearlyPrice),
                percent: number(
                  Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) / 100,
                  { style: "percent" }
                ),
              })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.maxCars === -1
                ? tPlans("features.carListingsUnlimited")
                : tPlans("features.carListings", { count: plan.maxCars, value: number(plan.maxCars) })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.maxMembers === -1
                ? tPlans("features.teamMembersUnlimited")
                : tPlans("features.teamMembers", { count: plan.maxMembers, value: number(plan.maxMembers) })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Image className="h-4 w-4 text-muted-foreground" />
            <span>
              {tPlans("features.imagesPerCar", {
                count: plan.maxImagesPerCar,
                value: number(plan.maxImagesPerCar),
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.auditLogRetentionDays === null
                ? tPlans("features.auditLogsUnlimited")
                : tPlans("features.auditLogs", {
                    count: plan.auditLogRetentionDays,
                    value: number(plan.auditLogRetentionDays),
                  })}
            </span>
          </div>
        </div>

        {allFeatures.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">{t("features")}</p>
              {allFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="flex items-center gap-2 text-sm">
                    {feature.enabled ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className={feature.enabled ? "" : "text-muted-foreground"}>{feature.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full text-center">
          <Badge variant="outline" className="text-sm">
            <Building2 className="h-3 w-3 me-1" />
            {t("activeSubscriptions", {
              count: plan.activeSubscriptions,
              value: number(plan.activeSubscriptions),
            })}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
