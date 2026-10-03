"use client";

import { MAX_COMPARE_CARS } from "./utils";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Scale, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteEmptyState } from "@/components/brand";
import { useFormatters } from "@/hooks/use-formatters";
import CompareCarCard from "./CompareCarCard";
import { handleRemoveCar } from "./utils";
import type { CompareCar } from "../_lib/compare-types";

/**
 * Empty state for the compare page (Figma: EmptyState).
 *
 *  1. **No cars** – the site empty state: what happened, and the way to Browse.
 *  2. **One car** – that car beside the next step, since a comparison needs two.
 *
 * Uses shared `handleRemoveCar` from utils instead of duplicated logic.
 */
const EmptyCompare = ({ singleCar }: { singleCar: CompareCar | null }) => {
  const t = useTranslations("compare.empty");
  const fmt = useFormatters();
  // Formatted before interpolation, so the Arabic page gets its own digits.
  const max = fmt.number(MAX_COMPARE_CARS);

  if (!singleCar) {
    return (
      <SiteEmptyState
        icon={Scale}
        title={t("noneTitle")}
        description={t("noneBody", { max })}
        primary={{ label: t("browseCars"), href: "/cars" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-sheet border border-border bg-card md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="border-b border-border p-4 sm:p-5 md:border-b-0 md:border-e">
        <CompareCarCard car={singleCar} onRemove={handleRemoveCar} />
      </div>

      <div className="flex flex-col items-start justify-center gap-3 p-6 sm:p-10">
        <span aria-hidden className="mb-1 flex size-14 items-center justify-center rounded-full border-2 border-border-strong bg-marker">
          <Scale className="size-6" />
        </span>
        <h2 className="text-h2 font-extrabold">{t("addAnotherTitle")}</h2>
        <p className="max-w-md text-body text-muted-foreground">{t("addAnotherBody")}</p>
        <Button variant="marker" size="xl" asChild className="mt-2">
          <Link href="/cars">
            <Search aria-hidden />
            {t("browseCars")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default EmptyCompare;
