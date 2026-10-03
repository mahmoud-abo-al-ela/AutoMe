"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Body-type shortcuts with live counts (Figma: Home — Browse by body). The
 * count is the tile's headline: it answers "is there anything for me here?"
 * before the click. Phones scroll the row sideways rather than stacking five
 * tiles into a tall block.
 */
export function BodyTypeTiles({ items }: { items: { value: string; count: number }[] }) {
  const t = useTranslations("home.body");
  const attr = useCarAttributes();
  const fmt = useFormatters();

  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {items.map(({ value, count }) => (
        <li key={value} className="w-[42%] shrink-0 snap-start sm:w-auto">
          <Link
            href={`/cars?bodyType=${encodeURIComponent(value)}`}
            className="relative flex h-full flex-col gap-1 rounded-control border border-border bg-card p-4 transition-colors hover:border-border-strong sm:p-5"
          >
            <span className="text-[2.5rem] leading-none font-black tabular-nums sm:text-[3rem]">{fmt.number(count)}</span>
            <span className="text-body font-semibold">{attr.body(value)}</span>
            <span className="sr-only">{t("carsCount", { count, value: fmt.number(count) })}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
