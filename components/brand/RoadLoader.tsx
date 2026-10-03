"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { useSiteBrandName } from "./SiteBrand";

/**
 * The public site's loading state for waits with no known layout (Figma:
 * Loader, concept "On the road"): the logo plate holds still while the hero's
 * road dashes run beneath it, so the page reads as on its way. Pages whose
 * layout is known keep their skeletons instead — those make a wait feel
 * shorter than any animation.
 *
 * It fills the content area — the header and tab bar stay usable — and fades
 * in after 300ms, so a fast load shows nothing; with reduced motion the dashes
 * stand still and the words carry it. The plate carries the dealership's name
 * on its subdomain (SiteBrandProvider), as the header does. `label` and
 * `description` replace the generic caption when the wait has a specific
 * reason worth naming (confirming a payment).
 */
export function RoadLoader({
  label,
  description,
  className,
}: {
  label?: string;
  description?: string;
  className?: string;
}) {
  const t = useTranslations("common.states");
  const brand = useSiteBrandName();

  return (
    <div
      role="status"
      className={cn(
        "loader-in flex min-h-[70svh] flex-col items-center justify-center gap-6 px-4 text-center",
        className
      )}
    >
      <Logo name={brand} size="lg" />
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
