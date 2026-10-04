"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * The plan at the foot of the overview: its name, cars used of the limit, and
 * the way to change it. Blue, not yellow — information, not a call to act;
 * the upgrade banners at the top of the page do the asking near the limit.
 */
export function PlanUsageBar({ orgSlug }: { orgSlug: string }) {
  const t = useTranslations("org.dashboard.today.plan");
  const { number } = useFormatters();
  const { usage } = usePlanUsage("cars");

  if (!usage || usage.planType === "NONE") return null;

  const unlimited = usage.limit === -1;
  const share = unlimited || usage.limit <= 0 ? 0 : Math.min(100, (usage.current / usage.limit) * 100);

  return (
    <section
      aria-label={t("manage")}
      className="flex flex-wrap items-center justify-between gap-4 rounded-sheet border border-border bg-card px-6 py-5"
    >
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2">
        <span className="text-body font-bold">
          {unlimited
            ? t("unlimited", { plan: usage.planType, current: number(usage.current) })
            : t("usage", { plan: usage.planType, current: number(usage.current), limit: number(usage.limit) })}
        </span>
        {!unlimited && (
          <span className="block h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
          </span>
        )}
      </div>
      <Link href={`/org/${orgSlug}/billing`} className="text-caption font-semibold text-primary hover:underline">
        {t("manage")}
      </Link>
    </section>
  );
}
