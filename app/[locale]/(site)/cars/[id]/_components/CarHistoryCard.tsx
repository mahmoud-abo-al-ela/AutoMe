"use client";

import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import { statedDisclosures, type CarDisclosures, type DealershipTerms } from "@/lib/utils/car-disclosures";
import {
  DealershipTermsList,
  DisclosureList,
  hasStatedTerms,
  type DisclosureLine,
} from "@/components/dealership/DealershipTermsList";

type Props = {
  car: Partial<CarDisclosures>;
  terms: Partial<DealershipTerms> | undefined;
};

/**
 * The car's history and the dealership's terms — only what the dealer stated.
 * A field left "not stated" is absent here rather than shown as "no": silence
 * about accidents is not a claim that there were none.
 */
const CarHistoryCard = ({ car, terms = {} }: Props) => {
  const t = useTranslations("carDetail.history");
  const fmt = useFormatters();
  const stated = statedDisclosures(car);

  const carLines: DisclosureLine[] = [];
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

  const showTerms = hasStatedTerms(terms);

  if (carLines.length === 0 && !showTerms) return null;

  return (
    <Card className=" border-0 bg-card p-0">
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-positive-soft rounded-lg">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-positive" aria-hidden />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("title")}</h3>
        </div>

        {carLines.length > 0 && <DisclosureList lines={carLines} />}

        {showTerms && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold text-foreground">{t("dealershipTerms")}</h4>
            <DealershipTermsList terms={terms} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t("statedByDealer")}</p>
      </CardContent>
    </Card>
  );
};

export default CarHistoryCard;
