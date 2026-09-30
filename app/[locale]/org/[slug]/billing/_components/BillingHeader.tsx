"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BillingHeader() {
  const t = useTranslations("org.billing");

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <CreditCard className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>
    </div>
  );
}
