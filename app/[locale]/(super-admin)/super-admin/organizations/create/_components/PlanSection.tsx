"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Plan } from "@/lib/generated/prisma";
import type { CreateOrganizationFormData } from "./CreateOrganizationForm";
import { formatPlanAmount } from "@/lib/utils/currency";

export default function PlanSection({
  formData,
  plans,
  onPlanChange,
}: {
  formData: CreateOrganizationFormData;
  plans: Plan[];
  onPlanChange: (planId: string) => void;
}) {
  const t = useTranslations("superAdmin.organizations.form.plan");
  const tCommon = useTranslations("superAdmin.common");
  // Limit copy is shared with the public pricing cards.
  const tFeatures = useTranslations("plans.features");
  const { number, locale } = useFormatters();
  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planId">{t("label")}</Label>
            <Select value={formData.planId} onValueChange={onPlanChange}>
              <SelectTrigger id="planId">
                <SelectValue placeholder={t("placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {tCommon("planOption", {
                      name: plan.name,
                      amount: formatPlanAmount(plan.monthlyPrice, locale),
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  {t("features", { name: selectedPlan.name })}
                </p>
                <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
                  <li>
                    {selectedPlan.maxCars === -1
                      ? tFeatures("carListingsUnlimited")
                      : tFeatures("carListings", {
                          value: number(selectedPlan.maxCars),
                        })}
                  </li>
                  <li>
                    {selectedPlan.maxMembers === -1
                      ? tFeatures("teamMembersUnlimited")
                      : tFeatures("teamMembers", {
                          value: number(selectedPlan.maxMembers),
                        })}
                  </li>
                  <li>
                    {tFeatures("imagesPerCar", {
                      value: number(selectedPlan.maxImagesPerCar),
                    })}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
