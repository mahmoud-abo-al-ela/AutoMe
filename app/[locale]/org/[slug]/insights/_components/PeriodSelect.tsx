"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PERIODS = [7, 30, 90] as const;

/**
 * The period for the whole page (page pattern 9: the range comes first and
 * every chart follows it). Kept in the URL — `?days=30` — so a period can be
 * shared or bookmarked, and the server renders the page for it. While the
 * new period loads, a spinner sits by the control that changed.
 */
export function PeriodSelect({ days }: { days: number }) {
  const t = useTranslations("org.insights.period");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <label id="period-label" className="text-caption font-semibold">
        {t("label")}
      </label>
      <div className="flex items-center gap-2">
        <Select
          value={String(days)}
          onValueChange={(value) => startTransition(() => router.replace(`${pathname}?days=${value}`, { scroll: false }))}
        >
          <SelectTrigger aria-labelledby="period-label" className="h-11 min-w-[200px] rounded-control border-[#8c8170] bg-field">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {PERIODS.map((period) => (
              <SelectItem key={period} value={String(period)}>
                {t(`d${period}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
