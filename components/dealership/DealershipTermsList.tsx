"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { resolveDealershipText } from "@/lib/utils/dealership-text";
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
  // In the reader's language once translated; the dealer's own words until then.
  const locale = useLocale() as Locale;
  const note = terms.offersFinancing ? resolveDealershipText(terms, "financingNote", locale) : null;
  const lines: DisclosureLine[] = DEALERSHIP_TERM_FLAGS.filter((flag) => typeof terms[flag] === "boolean").map((flag) => ({
    key: flag,
    text: t(`terms.${flag}.${terms[flag] ? "yes" : "no"}`),
    positive: !!terms[flag],
  }));
  if (lines.length === 0) return null;

  return (
    <div className={className}>
      <DisclosureList lines={lines} stacked={stacked} />
      {note && (
        // Set in the page's direction, like the list above it — also while it
        // falls back to the dealer's words in the other language — not flipped
        // to the other side of the card by dir="auto".
        <p className="mt-2 text-sm text-muted-foreground">{note.text}</p>
      )}
    </div>
  );
}

/** Whether any term is stated — the car page drops the terms block when none is. */
export function hasStatedTerms(terms: Partial<DealershipTerms>) {
  return DEALERSHIP_TERM_FLAGS.some((flag) => typeof terms[flag] === "boolean");
}
