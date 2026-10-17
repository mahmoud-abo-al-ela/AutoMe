"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { useSiteBrandName, useSitePlateBand } from "./SiteBrand";
import type { PlateBand } from "@/lib/org/client";

export function RoadLoader({
  label,
  description,
  band,
  className,
}: {
  label?: string;
  description?: string;
  /** The plate's band, where no SiteBrandProvider gives it (the dashboard, the root loader). */
  band?: PlateBand;
  className?: string;
}) {
  const t = useTranslations("common.states");
  const brand = useSiteBrandName();
  const siteBand = useSitePlateBand();

  return (
    <div
      role="status"
      className={cn(
        "loader-in flex min-h-[70svh] flex-col items-center justify-center gap-6 px-4 text-center",
        className
      )}
    >
      <Logo name={brand} size="lg" band={band ?? siteBand} />
      <span aria-hidden className="road-run block h-1.5 w-44 rounded-full" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className={label ? "text-body font-semibold" : "text-caption text-muted-foreground"}>
          {label ?? t("onTheWay")}
        </p>
        {description && <p className="text-caption text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
