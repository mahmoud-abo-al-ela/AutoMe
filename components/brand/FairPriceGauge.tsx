"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { FAIR_BAND, priceVerdict, type PriceVerdict } from "@/lib/utils/price-verdict";

export { priceVerdict, type PriceVerdict };

/** The gauge spans ±SCALE % around the median; anything further pins to the end. */
const SCALE = 20;

/**
 * How a listing price sits against comparable listings. `percent` is this
 * car against their median (−6 = 6% below); null when there were too few
 * comparables to say anything — the gauge then shows an empty track rather
 * than guessing.
 */
export interface MarketPositionProps {
  percent: number | null;
  /** How many comparable listings the median came from. */
  listings?: number;
  /** The median itself, in major units — shown on the full gauge only. */
  median?: number;
}


const VERDICT_TEXT = {
  below: "text-price-below",
  fair: "text-muted-foreground",
  above: "text-price-above",
  unknown: "text-muted-foreground",
} as const;

/** "6% below market", "Fair price", … — the words that always accompany the gauge. */
export function usePriceVerdictText(percent: number | null) {
  const t = useTranslations("common.market");
  const fmt = useFormatters();
  const verdict = priceVerdict(percent);
  if (verdict === "unknown" || percent == null) return { verdict, text: t("unknown") };
  if (verdict === "fair") return { verdict, text: t("fair") };
  const value = fmt.number(Math.abs(percent) / 100, { style: "percent", maximumFractionDigits: 0 });
  return { verdict, text: t(verdict, { value }) };
}

/**
 * Direction B's signature, set in the Cairo Plate palette (Figma:
 * FairPriceGauge). A band from −20% to +20% around the market median, split
 * below / fair / above, with a needle at this car's price.
 *
 * Laid out with logical properties only, so the scale mirrors in Arabic
 * (below-market on the right, at the reading start) without a second code
 * path. Colour is never the only signal: the verdict text sits beside it,
 * and the whole thing is labelled for screen readers.
 */
export function FairPriceGauge({
  percent,
  variant = "mini",
  className,
}: Pick<MarketPositionProps, "percent"> & {
  variant?: "mini" | "full";
  className?: string;
}) {
  const t = useTranslations("common.market");
  const fmt = useFormatters();
  const { text } = usePriceVerdictText(percent);
  const known = percent != null;
  const clamped = known ? Math.max(-SCALE, Math.min(SCALE, percent)) : 0;
  // Position along the band, 0% at −SCALE and 100% at +SCALE.
  const at = ((clamped + SCALE) / (2 * SCALE)) * 100;
  const fairStart = ((SCALE - FAIR_BAND) / (2 * SCALE)) * 100;
  const full = variant === "full";
  const edge = (v: number) =>
    fmt.number(v / 100, { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 0 });

  return (
    <div
      role="img"
      aria-label={t("gaugeLabel", { verdict: text })}
      className={cn("relative w-full", full ? "pt-3" : "", className)}
    >
      <div className={cn("relative", full ? "h-9" : "h-[18px]")}>
        {known ? (
          <div
            className={cn(
              "absolute inset-x-0 flex overflow-hidden rounded-full",
              full ? "top-[14px] h-1.5" : "top-[7px] h-1"
            )}
          >
            <span className="bg-price-below" style={{ width: `${fairStart}%` }} />
            <span className="bg-price-fair" style={{ width: `${100 - 2 * fairStart}%` }} />
            <span className="flex-1 bg-price-above" />
          </div>
        ) : (
          <div
            className={cn(
              "absolute inset-x-0 rounded-full bg-price-fair/35",
              full ? "top-[14px] h-1.5" : "top-[7px] h-1"
            )}
          />
        )}
        {full &&
          [0, 25, 50, 75, 100].map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute top-[22px] h-2 w-px bg-foreground/60"
              style={{ insetInlineStart: `${tick}%` }}
            />
          ))}
        {known && (
          <span
            aria-hidden
            className={cn(
              "absolute w-0.5 -translate-x-1/2 rounded-full bg-foreground rtl:translate-x-1/2",
              full ? "top-1 h-[30px]" : "top-0 h-[18px]"
            )}
            style={{ insetInlineStart: `${at}%` }}
          >
            {full && (
              <span className="absolute -top-2 start-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-border-strong bg-marker rtl:translate-x-1/2" />
            )}
          </span>
        )}
      </div>
      {full && (
        <div aria-hidden className="mt-1 flex justify-between text-micro text-muted-foreground">
          <span dir="ltr">{edge(-SCALE)}</span>
          <span>{t("median")}</span>
          <span dir="ltr">{edge(SCALE)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The verdict line: a coloured dot and the words, then how many comparables
 * they rest on. `countClassName` lets a card drop the count on the 2-up phone
 * layout (`max-sm:hidden`) without a second component.
 */
export function PriceVerdictLine({
  percent,
  listings,
  className,
  countClassName,
}: MarketPositionProps & { className?: string; countClassName?: string }) {
  const t = useTranslations("common.market");
  const fmt = useFormatters();
  const { verdict, text } = usePriceVerdictText(percent);
  const showCount = verdict !== "unknown" && listings != null;

  return (
    <p className={cn("flex items-center gap-1.5 text-micro font-medium", VERDICT_TEXT[verdict], className)}>
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          verdict === "below" && "bg-price-below",
          verdict === "above" && "bg-price-above",
          (verdict === "fair" || verdict === "unknown") && "bg-price-fair"
        )}
      />
      <span className="truncate">
        {text}
        {showCount && (
          <span className={countClassName}>
            {" · "}
            {t("comparables", { count: listings, value: fmt.number(listings) })}
          </span>
        )}
      </span>
    </p>
  );
}
