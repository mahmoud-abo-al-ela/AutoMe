"use client";

import { useTranslations } from "next-intl";

export default function PlansHeader() {
  const t = useTranslations("superAdmin.plans");

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
    </div>
  );
}
