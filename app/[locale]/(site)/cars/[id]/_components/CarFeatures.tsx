"use client";

import { Check, Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { localeDirection } from "@/i18n/routing";
import type { ResolvedCarFeatures } from "@/lib/utils/car-text";

const CarFeatures = ({ resolved }: { resolved: ResolvedCarFeatures }) => {
  const t = useTranslations("carDetail.features");
  const { features } = resolved;
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="sr-only">{t("title")}</h3>
      {/* dir follows the list, not the page — see CarDescription. */}
      <ul dir={localeDirection[resolved.locale]} className="grid gap-x-8 sm:grid-cols-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2.5 border-b border-border py-3 text-body">
            <Check aria-hidden className="size-[18px] shrink-0 text-positive" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {resolved.fellBack && (
        <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
          <Languages className="size-3.5 shrink-0" aria-hidden />
          {t("notTranslated")}
        </p>
      )}
    </div>
  );
};

export default CarFeatures;
