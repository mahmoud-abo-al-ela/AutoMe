"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { priceVerdict } from "@/lib/utils/price-verdict";
import { cn } from "@/lib/utils";
import type { Insights } from "@/lib/services/dashboard";

export type InsightCar = Insights["cars"][number];

const PER_PAGE = 10;

/** "8% above", "In line", … — the gauge's verdict, in words. */
function usePriceText() {
  const t = useTranslations("org.insights.table");
  const { number } = useFormatters();
  return (percent: number | null) => {
    const verdict = priceVerdict(percent);
    const amount = number(Math.abs(percent ?? 0) / 100, { style: "percent", maximumFractionDigits: 0 });
    if (verdict === "above") return { text: t("priceAbove", { percent: amount }), tone: "text-destructive" };
    if (verdict === "below") return { text: t("priceBelow", { percent: amount }), tone: "text-[#0a7350]" };
    if (verdict === "fair") return { text: t("priceFair"), tone: "text-muted-foreground" };
    return { text: t("priceUnknown"), tone: "text-muted-foreground" };
  };
}

const carName = (car: InsightCar) => `${car.make} ${car.model} ${car.year}`;

/**
 * Interest per car for the period: one framed table (page pattern 9's detail
 * table), most saved first, paged. The car opens its listing editor. Cells
 * are body/secondary size, never meta; numbers are tabular and end-aligned.
 */
export function InsightsTable({ cars, carsHref }: { cars: InsightCar[]; carsHref: string }) {
  const t = useTranslations("org.insights.table");
  const { number } = useFormatters();
  const priceText = usePriceText();
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(cars.length / PER_PAGE));
  const shown = cars.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section aria-labelledby="interest-title" className="overflow-hidden rounded-sheet border border-border bg-card">
      <div className="px-5 pb-3 pt-5 sm:px-6">
        <h2 id="interest-title" className="text-h3 font-semibold">
          {t("title")}
        </h2>
        <p className="text-caption text-muted-foreground">{t("description")}</p>
      </div>

      {cars.length === 0 ? (
        <div className="flex flex-col items-start gap-3 px-5 pb-6 sm:px-6">
          <p className="text-body text-muted-foreground">{t("empty")}</p>
          <Link href={`${carsHref}/create`} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "bg-card")}>
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-caption">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground">
                  <th scope="col" className="px-5 py-3 text-center font-semibold sm:px-6">{t("car")}</th>
                  <th scope="col" aria-sort="descending" className="px-3 py-3 text-center font-semibold text-foreground">{t("saves")}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{t("questions")}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{t("drives")}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{t("days")}</th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold sm:px-6">{t("price")}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((car) => {
                  const price = priceText(car.marketPercent);
                  return (
                    <tr key={car.id} className="border-t border-border">
                      <td className="px-5 py-3 text-center sm:px-6">
                        <Link href={`${carsHref}/${car.id}/edit`} className="font-semibold text-primary hover:underline" dir="auto">
                          {car.make} {car.model} {number(car.year, { useGrouping: false })}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">{number(car.saves)}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{number(car.questions)}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{number(car.drives)}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{number(car.daysListed)}</td>
                      <td className={cn("px-5 py-3 text-center sm:px-6", price.tone)}>{price.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label={t("pages.label")} className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-caption text-muted-foreground sm:px-6">
            <span>
              {t("pages.status", {
                from: number((page - 1) * PER_PAGE + 1),
                to: number(Math.min(page * PER_PAGE, cars.length)),
                total: number(cars.length),
              })}
            </span>
            <span className="flex gap-2">
              <Button variant="outline-strong" size="control" className="h-11 bg-card" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("pages.previous")}
              </Button>
              <Button variant="outline-strong" size="control" className="h-11 bg-card" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                {t("pages.next")}
              </Button>
            </span>
          </nav>
        </>
      )}
    </section>
  );
}

/**
 * The table as a CSV — every car, not just the page shown — with headers in
 * the reader's language and plain digits so a spreadsheet can sum them. A BOM
 * keeps Arabic readable when Excel opens it.
 */
export function ExportCsvButton({ cars, days }: { cars: InsightCar[]; days: number }) {
  const t = useTranslations("org.insights");
  const locale = useLocale();
  const priceText = usePriceText();

  const exportCsv = () => {
    const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [t("table.car"), t("table.saves"), t("table.questions"), t("table.drives"), t("table.days"), t("table.price")];
    const lines = [
      header.map(cell).join(","),
      ...cars.map((car) =>
        [carName(car), car.saves, car.questions, car.drives, car.daysListed, priceText(car.marketPercent).text].map(cell).join(","),
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autome-insights-${days}d-${locale}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline-strong" size="control" className="h-11 bg-card" onClick={exportCsv} disabled={cars.length === 0}>
      <Download aria-hidden className="size-4" />
      {t("export")}
    </Button>
  );
}
