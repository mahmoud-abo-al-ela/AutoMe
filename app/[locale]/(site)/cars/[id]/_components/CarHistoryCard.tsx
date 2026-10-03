"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardList, MinusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import {
  DEALERSHIP_TERM_FLAGS,
  statedDisclosures,
  type CarDisclosures,
  type DealershipTerms,
} from "@/lib/utils/car-disclosures";

type Props = {
  car: Partial<CarDisclosures>;
  terms: Partial<DealershipTerms> | undefined;
};

type Line = { key: string; text: string; positive: boolean };

/**
 * The car's history and the dealership's terms — only what the dealer stated.
 * A field left "not stated" is absent here rather than shown as "no": silence
 * about accidents is not a claim that there were none.
 */
const CarHistoryCard = ({ car, terms = {} }: Props) => {
  const t = useTranslations("carDetail.history");
  const fmt = useFormatters();
  const stated = statedDisclosures(car);

  const carLines: Line[] = [];
  if (stated.originalPaint !== undefined) {
    carLines.push({ key: "paint", text: t(stated.originalPaint ? "originalPaint" : "repainted"), positive: !!stated.originalPaint });
  }
  if (stated.accidentFree !== undefined) {
    carLines.push({ key: "accident", text: t(stated.accidentFree ? "accidentFree" : "hadAccident"), positive: !!stated.accidentFree });
  }
  if (stated.ownerCount) {
    carLines.push({
      key: "owners",
      text: t("owners", { count: stated.ownerCount, value: fmt.number(stated.ownerCount) }),
      positive: stated.ownerCount === 1,
    });
  }
  if (stated.serviceHistory) {
    carLines.push({ key: "service", text: t(`service.${stated.serviceHistory}`), positive: stated.serviceHistory === "FULL" });
  }
  if (stated.priceNegotiable !== undefined) {
    carLines.push({ key: "price", text: t(stated.priceNegotiable ? "negotiable" : "fixedPrice"), positive: true });
  }
  if (stated.licenseValidUntil) {
    const month = fmt.date(`${stated.licenseValidUntil}-01T00:00:00Z`, {
      // formatDate adds a day by default; a licence runs to a month.
      day: undefined,
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    carLines.push({ key: "license", text: t("licensedUntil", { month }), positive: true });
  }

  const termLines: Line[] = DEALERSHIP_TERM_FLAGS.filter((flag) => typeof terms[flag] === "boolean").map(
    (flag) => ({ key: flag, text: t(`terms.${flag}.${terms[flag] ? "yes" : "no"}`), positive: !!terms[flag] })
  );

  if (carLines.length === 0 && termLines.length === 0) return null;

  const list = (lines: Line[]) => (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

  return (
    <Card className=" border-0 bg-card p-0">
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-positive-soft rounded-lg">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-positive" aria-hidden />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("title")}</h3>
        </div>

        {carLines.length > 0 && list(carLines)}

        {termLines.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold text-foreground">{t("dealershipTerms")}</h4>
            {list(termLines)}
            {terms.financingNote && (
              // The dealer's own words, in whatever language they wrote them.
              <p dir="auto" className="text-sm text-muted-foreground">
                {terms.financingNote}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t("statedByDealer")}</p>
      </CardContent>
    </Card>
  );
};

export default CarHistoryCard;
