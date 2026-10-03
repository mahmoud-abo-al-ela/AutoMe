"use client";

import { useTranslations } from "next-intl";
import { FairPriceGauge, PriceVerdictLine } from "@/components/brand";
import { useFormatters } from "@/hooks/use-formatters";
import type { MarketPosition } from "@/lib/services/car/market-price";

/**
 * Where this price sits in the market (Figma: FairPriceGauge / Full) — the
 * gauge, the verdict in words, and what the verdict rests on. The same
 * comparison the listing assistant quotes (lib/services/car/market-price).
 */
export function MarketPriceBlock({ market, currency }: { market: MarketPosition | null; currency: string }) {
  const t = useTranslations("common.market");
  const fmt = useFormatters();

  return (
    <div className="flex flex-col gap-2.5">
      <FairPriceGauge percent={market?.percent ?? null} variant="full" />
      <PriceVerdictLine
        percent={market?.percent ?? null}
        className="text-caption [&>span:last-child]:whitespace-normal"
        // The count is in the sentence below; the line keeps just the verdict.
        countClassName="hidden"
        listings={market?.listings}
      />
      <p className="text-micro text-muted-foreground">
        {market
          ? t("medianFor", {
              median: fmt.price(market.median, currency),
              comparables: t("comparables", { count: market.listings, value: fmt.number(market.listings) }),
            })
          : t("unknownDetail")}
      </p>
    </div>
  );
}
