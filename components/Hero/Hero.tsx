import Image from "next/image";
import type { CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/utils/number";
import { formatCarPrice } from "@/lib/utils/currency";
import { BUDGET_MAX_EGP } from "@/lib/constants/car-options";
import { HeroParallax } from "@/components/Home/motion/HeroParallax";
import type { Locale } from "@/i18n/routing";
import HeroSearch from "./HeroSearch";

/** The live counts the search band states — from getMarketSummary, never typed into copy. */
export interface HeroSummary {
  listings: number;
  dealerships: number;
}

/** A CSS custom property for the entrance timing (globals.css: .hero-*). */
const cssVar = (name: string, value: string | number) => ({ [name]: value }) as CSSProperties;

/**
 * Home hero, "Street level" (Figma: Home — hero B). The hero photo across the
 * full width, the headline set low on it, and the plate search docked on its
 * bottom edge.
 *
 * The overlay is built from the site's palette: a plate-blue wash, asphalt
 * rising behind the words so the headline reads on any photo, and a low
 * marker-yellow glow like a street lamp. The quick picks sit below, on the
 * page, to keep the photo uncluttered.
 *
 * Motion: the photo settles from a slow zoom and drifts in parallax, the
 * headline's words rise in one by one, a road-paint stroke paints in under the
 * accent clause, and the rest follows; the glow breathes. The entrance is CSS so the headline — the page's largest paint —
 * never waits for JavaScript; all of it stops under reduced motion.
 *
 * The live count is stated once, on the search's plate band, from computed
 * numbers only; when they could not be read the band falls back to a label.
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

  // Word by word, so each can rise on its own beat; the spaces stay as text.
  const leadWords = `${t("titleLead")} ${t("titleTrustLead")}`.split(/\s+/).filter(Boolean);
  const accentWords = t("titleTrustAccent").split(/\s+/).filter(Boolean);
  const word = (text: string, index: number) => (
    <span key={index} className="hero-word" style={cssVar("--i", index)}>
      {text}
    </span>
  );

  return (
    <section id="main-content" aria-labelledby="hero-title" className="relative">
      <div className="relative isolate overflow-hidden bg-inverse text-inverse-foreground">
        <HeroParallax>
          <Image src="/hero-car.jpg" alt="" fill priority sizes="100vw" className="hero-settle object-cover" />
        </HeroParallax>
        {/* The overlay, from the site's palette (globals.css: .hero-*). */}
        <div aria-hidden className="hero-wash absolute inset-0 -z-30" />
        <div aria-hidden className="hero-scrim absolute inset-0 -z-20" />
        <div aria-hidden className="hero-glow absolute inset-0 -z-10" />

        <div className="mx-auto flex min-h-[min(68svh,560px)] w-full max-w-[1360px] flex-col justify-end gap-4 px-4 pb-16 pt-24 sm:min-h-[min(78svh,720px)] sm:gap-5 sm:px-6 sm:pb-24 xl:px-0">
          <h1 id="hero-title" className="max-w-[14ch] text-display font-black">
            {leadWords.flatMap((text, i) => [word(text, i), " "])}
            <span className="hero-paint text-marker">
              {accentWords.flatMap((text, i) => [i > 0 ? " " : null, word(text, leadWords.length + i)])}
            </span>
          </h1>

          <p
            className="hero-follow max-w-[34rem] text-body text-inverse-foreground/80 sm:text-[1.125rem]"
            style={cssVar("--delay", "0.55s")}
          >
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Docked on the photo's lower edge: half on the photo, half on the page. */}
      <div className="relative z-10 mx-auto -mt-10 flex w-full max-w-[1360px] flex-col gap-4 px-4 sm:-mt-11 sm:px-6 xl:px-0">
        <div className="hero-follow w-full max-w-[600px] rounded-control shadow-float" style={cssVar("--delay", "0.7s")}>
          <HeroSearch
            bandLabel={
              summary && summary.listings > 0
                ? t("plateBand", { value: n(summary.listings) })
                : t("plateBandFallback")
            }
          />
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {quickPicks.map((pick, i) => (
            <li key={pick.href} className="hero-follow" style={cssVar("--delay", `${0.85 + i * 0.06}s`)}>
              <Link
                href={pick.href}
                className="inline-flex h-10 items-center rounded-full border border-border-strong/25 bg-card px-4 text-caption font-medium transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-field"
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
