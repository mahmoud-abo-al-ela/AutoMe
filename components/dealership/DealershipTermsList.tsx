"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, MinusCircle } from "lucide-react";
import { DEALERSHIP_TERM_FLAGS, type DealershipTerms } from "@/lib/utils/car-disclosures";

export type DisclosureLine = { key: string; text: string; positive: boolean };

/** Stated facts as a ticked list: a tick for a plus, a dash for a plain "no". */
export function DisclosureList({ lines, stacked = false }: { lines: DisclosureLine[]; stacked?: boolean }) {
  return (
    <ul className={stacked ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
      {lines.map((line) => (
        <li key={line.key} className="flex items-start gap-2 text-sm text-muted-foreground">
          {line.positive ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" aria-hidden />
          ) : (
            <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
          )}
          {line.text}
        </li>
      ))}
    </ul>
  );
}

/**
 * A dealership's terms as buyers read them on every listing — only the ones
 * stated. Shared by the car page and the dealer's own settings preview, so the
 * preview is the listing's wording, not a copy of it.
 */
export function DealershipTermsList({
  terms,
  stacked,
  className,
}: {
  terms: Partial<DealershipTerms>;
  /** One column, for a narrow card (the dealership page's visit card). */
  stacked?: boolean;
  className?: string;
}) {
  const t = useTranslations("carDetail.history");
  const lines: DisclosureLine[] = DEALERSHIP_TERM_FLAGS.filter((flag) => typeof terms[flag] === "boolean").map((flag) => ({
    key: flag,
    text: t(`terms.${flag}.${terms[flag] ? "yes" : "no"}`),
    positive: !!terms[flag],
  }));
  if (lines.length === 0) return null;

  return (
    <div className={className}>
      <DisclosureList lines={lines} stacked={stacked} />
      {terms.offersFinancing && terms.financingNote && (
        // The dealer's own words, in whatever language they wrote them.
        <p dir="auto" className="mt-2 text-sm text-muted-foreground">
          {terms.financingNote}
        </p>
      )}
    </div>
  );
}

/** Whether any term is stated — the car page drops the terms block when none is. */
export function hasStatedTerms(terms: Partial<DealershipTerms>) {
  return DEALERSHIP_TERM_FLAGS.some((flag) => typeof terms[flag] === "boolean");
}
