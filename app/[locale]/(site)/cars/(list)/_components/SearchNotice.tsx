"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import type { SearchMatch } from "@/lib/services/car/listing";

/** One line above the results saying how the search read the buyer's words. */
export function SearchNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mb-4 flex items-start gap-2 rounded-control border border-border bg-muted/50 px-3 py-2.5 text-caption">
      <SearchX aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </p>
  );
}

/**
 * What the search did with words it could not use as typed: a typo read as
 * the word it was probably meant to be, words no car mentions set aside, no
 * car having them all, or none matching and the cars shown being the closest
 * in meaning. Nothing when every word matched.
 */
export function SearchMatchNotice({ searchMatch, locale }: { searchMatch: SearchMatch; locale: string }) {
  const t = useTranslations("cars.states");
  const { match, missing, corrected } = searchMatch;
  const b = (chunks: ReactNode) => <bdi className="font-semibold">{chunks}</bdi>;
  const terms = new Intl.ListFormat(locale, { type: "unit" }).format(missing);
  const either = new Intl.ListFormat(locale, { type: "disjunction" });

  const lines: ReactNode[] = [];
  if (match !== "none") {
    for (const { from, to } of corrected) {
      lines.push(t.rich("searchCorrected", { from, to: either.format(to), b }));
    }
  }
  if (match === "meaning") {
    lines.push(missing.length > 0 ? t.rich("searchMeaningOnly", { terms, b }) : t("searchClosest"));
  } else if (match === "all" || match === "some") {
    if (missing.length > 0) lines.push(t.rich("searchMissingWords", { terms, b }));
    if (match === "some") lines.push(t("searchSomeWords"));
  }
  if (lines.length === 0) return null;

  return (
    <SearchNotice>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </SearchNotice>
  );
}
