"use client";

import type { TransitionStartFunction } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_OVERVIEW_PERIOD, OVERVIEW_PERIODS } from "@/lib/services/super-admin/overview-options";

const trigger = "h-11 data-[size=default]:h-11 min-w-[176px] rounded-control border-[#8c8170] bg-field";

/**
 * The overview's period and what it is compared with. Both live in the URL
 * (`?days=90&compare=none`), so a view can be shared and the server renders
 * it; the defaults (30 days, against the period before) stay out of it. The
 * page dims while the new period loads — the transition is the page's.
 */
export function OverviewControls({
  days,
  compare,
  startTransition,
}: {
  days: number;
  compare: boolean;
  startTransition: TransitionStartFunction;
}) {
  const t = useTranslations("superAdmin.overview");
  const router = useRouter();
  const pathname = usePathname();

  const go = (next: { days: number; compare: boolean }) => {
    const params = new URLSearchParams();
    if (next.days !== DEFAULT_OVERVIEW_PERIOD) params.set("days", String(next.days));
    if (!next.compare) params.set("compare", "none");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label id="overview-period" className="text-caption font-semibold">
          {t("period.label")}
        </label>
        <Select value={String(days)} onValueChange={(value) => go({ days: Number(value), compare })}>
          <SelectTrigger aria-labelledby="overview-period" className={trigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {OVERVIEW_PERIODS.map((period) => (
              <SelectItem key={period} value={String(period)}>
                {t(`period.d${period}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label id="overview-compare" className="text-caption font-semibold">
          {t("compare.label")}
        </label>
        <Select value={compare ? "previous" : "none"} onValueChange={(value) => go({ days, compare: value === "previous" })}>
          <SelectTrigger aria-labelledby="overview-compare" className={trigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            <SelectItem value="previous">{t("compare.previous")}</SelectItem>
            <SelectItem value="none">{t("compare.none")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
