"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanType } from "@/lib/generated/prisma";

export default function AddPlanCard({
  availableTypes,
  onClick,
}: {
  availableTypes: PlanType[];
  onClick: () => void;
}) {
  const t = useTranslations("superAdmin.plans.add");

  return (
    <Card
      className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[400px]"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center text-center p-6">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">
          {availableTypes.length > 0 ? t("body") : t("allExist")}
        </p>
      </CardContent>
    </Card>
  );
}
