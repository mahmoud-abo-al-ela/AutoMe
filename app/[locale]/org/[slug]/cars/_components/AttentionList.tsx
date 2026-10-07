import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { CarFront, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import type { AttentionCar, AttentionReason } from "@/lib/services/dashboard";
import { formatNumber } from "@/lib/utils/number";
import { cn } from "@/lib/utils";

/**
 * The Cars page's "Needs attention" view: every available car that may not
 * be selling, its one reason, and the fix as a link to its editor — "Review
 * price", "Add photos", "Edit listing". The same list the overview shows the
 * top three of (lib/services/dashboard: carsNeedingAttention). Rows in one
 * frame; an empty list keeps the frame and says why there is nothing.
 */
export async function AttentionList({ cars, base }: { cars: AttentionCar[] | null; base: string }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("org.cars.attention");
  const tReason = await getTranslations("org.dashboard.today.attention");
  const n = (value: number) => formatNumber(value, locale);

  const reason = (r: AttentionReason) =>
    r.kind === "stale"
      ? tReason("stale", { days: n(r.days) })
      : r.kind === "price"
        ? tReason("price", { percent: formatNumber(r.percent / 100, locale, { style: "percent", maximumFractionDigits: 0 }) })
        : tReason("photos", { count: r.count, value: n(r.count) });

  return (
    <section aria-labelledby="attention-title" className="overflow-hidden rounded-sheet border border-border bg-card">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 id="attention-title" className="text-h3 font-semibold">
          {t("title")}
        </h2>
        <p className="text-caption text-muted-foreground">{t("description")}</p>
      </div>

      {cars === null ? (
        <p role="alert" className="px-5 py-6 text-body sm:px-6">
          {t("loadFailed")}
        </p>
      ) : cars.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span aria-hidden className="mb-2 flex size-14 items-center justify-center rounded-full bg-positive-soft text-positive">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="text-body font-semibold">{t("empty.title")}</p>
          <p className="max-w-sm text-caption text-muted-foreground">{t("empty.body")}</p>
          <Link href={`${base}/cars`} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "mt-2 bg-card")}>
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <ul>
          {cars.map((car) => (
            <li key={car.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border px-5 py-4 first:border-t-0 sm:px-6">
              <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted">
                {car.image ? (
                  <Image src={car.image} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <CarFront aria-hidden className="size-6 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-[1_1_16rem]">
                <p className="truncate text-body font-semibold" dir="auto">
                  {car.make} {car.model} {formatNumber(car.year, locale, { useGrouping: false })}
                </p>
                <p className={cn("text-caption font-semibold", car.reason.kind === "stale" ? "text-destructive" : "text-[#8a5e00]")}>
                  {reason(car.reason)}
                </p>
                <p className="text-micro text-muted-foreground">{t("listed", { days: n(car.daysListed) })}</p>
              </div>
              <Link
                href={`${base}/cars/${car.id}/edit`}
                className={cn(buttonVariants({ variant: "inverse", size: "control" }), "h-11 w-full sm:w-auto")}
              >
                {t(`actions.${car.reason.kind}`)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
