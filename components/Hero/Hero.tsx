import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RoadDashes } from "@/components/brand";
import { formatNumber } from "@/lib/utils/number";
import { formatCarPrice } from "@/lib/utils/currency";
import { BUDGET_MAX_EGP } from "@/lib/constants/car-options";
import type { Locale } from "@/i18n/routing";
import HeroSearch from "./HeroSearch";

/** The live counts the eyebrow states — from getMarketSummary, never typed into copy. */
export interface HeroSummary {
  listings: number;
  dealerships: number;
}

/**
 * Home hero, "Street level" (Figma: Home — hero B). The hero photo across the
 * full width, the headline set low on it, and the plate search docked on its
 * bottom edge.
 *
 * The overlay is built from the site's palette: a plate-blue wash, asphalt
 * rising behind the words so the headline reads on any photo, and a low
 * marker-yellow glow like a street lamp — with the brand's road dashes along
 * the foot, where the search docks. The quick picks sit below, on the page,
 * to keep the photo uncluttered.
 *
 * The eyebrow states only computed numbers; when they could not be read it is
 * left out rather than filled with a guess.
 */
export default async function Hero({ summary }: { summary: HeroSummary | null }) {
  const t = await getTranslations("home.hero");
  const locale = (await getLocale()) as Locale;
  const n = (value: number) => formatNumber(value, locale);

  const quickPicks = [
    { href: `/cars?maxPrice=${BUDGET_MAX_EGP}`, label: t("quickUnder", { price: formatCarPrice(BUDGET_MAX_EGP, locale) }) },
    { href: "/cars?transmission=Automatic", label: t("quickAutomatic") },
    { href: "/cars?bodyType=SUV", label: t("quickSuv") },
    { href: "/cars?fuelType=Electric", label: t("quickElectric") },
    { href: "/cars?minSeats=7", label: t("quickSevenSeats") },
  ];

  return (
    <section id="main-content" aria-labelledby="hero-title" className="relative">
      <div className="relative isolate overflow-hidden bg-inverse text-inverse-foreground">
        <Image
          src="/hero-car.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-40 object-cover"
        />
        {/* The overlay, from the site's palette (globals.css: .hero-*). */}
        <div aria-hidden className="hero-wash absolute inset-0 -z-30" />
        <div aria-hidden className="hero-scrim absolute inset-0 -z-20" />
        <div aria-hidden className="hero-glow absolute inset-0 -z-10" />
        {/* A road marking along the photo's foot, where the search docks. */}
        <RoadDashes className="absolute inset-x-0 bottom-0 h-1.5 rounded-none" />

        <div className="mx-auto flex min-h-[min(68svh,560px)] w-full max-w-[1360px] flex-col justify-end gap-4 px-4 pb-16 pt-24 sm:min-h-[min(78svh,720px)] sm:gap-5 sm:px-6 sm:pb-24 xl:px-0">
          {summary && summary.listings > 0 && (
            <p className="flex w-fit items-center gap-2 rounded-full bg-inverse-foreground/15 px-3 py-1.5 text-micro font-medium backdrop-blur-sm">
              <span aria-hidden className="size-2 rounded-full bg-marker" />
              {t("liveCars", { count: summary.listings, value: n(summary.listings) })}
              {" · "}
              {t("liveDealers", { count: summary.dealerships, value: n(summary.dealerships) })}
            </p>
          )}

          <h1 id="hero-title" className="max-w-[14ch] text-display font-black">
            {t("titleLead")} {t("titleTrustLead")} <span className="text-marker">{t("titleTrustAccent")}</span>
          </h1>

          <p className="max-w-[34rem] text-body text-inverse-foreground/80 sm:text-[1.125rem]">{t("subtitle")}</p>
        </div>
      </div>

      {/* Docked on the photo's lower edge: half on the photo, half on the page. */}
      <div className="relative z-10 mx-auto -mt-10 flex w-full max-w-[1360px] flex-col gap-4 px-4 sm:-mt-11 sm:px-6 xl:px-0">
        <div className="w-full max-w-[600px] rounded-control shadow-float">
          <HeroSearch
            bandLabel={
              summary && summary.listings > 0
                ? t("plateBand", { value: n(summary.listings) })
                : t("plateBandFallback")
            }
          />
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {quickPicks.map((pick) => (
            <li key={pick.href}>
              <Link
                href={pick.href}
                className="inline-flex h-10 items-center rounded-full border border-border-strong/25 bg-card px-4 text-caption font-medium transition-colors hover:border-border-strong hover:bg-field"
              >
                {pick.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
