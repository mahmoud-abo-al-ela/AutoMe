import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { formatNumber } from "@/lib/utils/number";
import { formatCarPrice } from "@/lib/utils/currency";
import { getMarketSummary } from "@/actions/cars-listing";
import { cn } from "@/lib/utils";
// buttonVariants on the Link rather than <Button asChild>: in a Server
// Component the i18n Link suspends on the locale, reaches Radix Slot as a lazy
// element, and Slot renders nothing for it.
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/brand";
import { SectionHeader } from "@/components/Home/SectionHeader";
import { StartFreeButton } from "@/components/Home/StartFreeButton";
import {
  Car,
  Shield,
  Users,
  Zap,
  Heart,
  ArrowRight,
  Building2,
  MessageSquare,
  BarChart3,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });

  return localizedPageMetadata("/about", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

// Icons and order only. Every string these used to carry now lives in
// messages/{en,ar}/about.json, keyed by the same id — the pattern the contact
// and compare surfaces already use.
const values = [
  { key: "trust", icon: Shield },
  { key: "innovation", icon: Zap },
  { key: "community", icon: Users },
  { key: "customer", icon: Heart },
] as const;

const features = [
  { key: "inventory", icon: Car },
  { key: "messaging", icon: MessageSquare },
  { key: "analytics", icon: BarChart3 },
  { key: "multiLocation", icon: Building2 },
] as const;

const container = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0";

export default async function AboutPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations("about");

  // The figures are read from the live stock (the same summary the home hero
  // and Browse use) instead of the "500+ dealerships / 100K+ buyers" this page
  // used to state, none of which was measured. With nothing listed they are
  // left out rather than showing zeros, and the hero closes up to one column.
  const summaryResponse = await getMarketSummary();
  const summary = summaryResponse.success ? summaryResponse.data : null;
  const live = summary && summary.listings > 0 ? summary : null;
  const counts = live
    ? [
        { label: t("figures.cars"), value: formatNumber(live.listings, locale) },
        { label: t("figures.dealerships"), value: formatNumber(live.dealerships, locale) },
        live.cities > 0 ? { label: t("figures.cities"), value: formatNumber(live.cities, locale) } : null,
      ].filter((figure) => figure !== null)
    : [];
  // The price is the one long figure, and Intl joins "EGP" to the amount with
  // a no-break space, so it cannot wrap: it gets a row of its own.
  const median =
    live?.medianPrice != null ? { label: t("figures.median"), value: formatCarPrice(live.medianPrice, locale) } : null;

  const figures = counts.length > 0 && (
    <section aria-label={t("figures.label")} className="flex flex-col gap-3">
      <p className="text-caption font-semibold text-inverse-foreground/70">{t("figures.label")}</p>
      <dl
        className={cn(
          "grid gap-px overflow-hidden rounded-control border border-inverse-foreground/15 bg-inverse-foreground/15",
          counts.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {[...counts, ...(median ? [median] : [])].map((figure) => (
          <div
            key={figure.label}
            className={cn(
              "flex min-w-0 flex-col-reverse justify-end gap-1 bg-inverse p-3 sm:p-5",
              figure === median && "col-span-full",
            )}
          >
            <dt className="text-micro text-inverse-foreground/70 sm:text-caption">{figure.label}</dt>
            <dd className={cn("font-black tabular-nums", figure === median ? "text-h2 text-marker" : "text-h3 sm:text-h2")}>
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className="flex flex-col pb-16">
      <PageHeader
        tone="inverse"
        eyebrow={t("hero.eyebrow")}
        title={t("hero.headline")}
        accent={t("hero.headlineAccent")}
        subtitle={t("hero.subtitle")}
        aside={figures || undefined}
      >
        <Link href="/cars" className={buttonVariants({ variant: "marker", size: "xl" })}>
          {t("hero.browseCars")}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
        <Link
          href="/contact"
          className={buttonVariants({
            variant: "outline",
            size: "xl",
            className:
              "border-inverse-foreground/35 bg-transparent text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground",
          })}
        >
          {t("hero.getInTouch")}
        </Link>
      </PageHeader>

      <section aria-labelledby="mission-title" className={`${container} pt-12 sm:pt-16`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <p className="text-caption font-semibold text-muted-foreground">{t("mission.eyebrow")}</p>
            <h2 id="mission-title" className="text-h1 font-extrabold">
              {t("mission.headline")} <span className="text-primary">{t("mission.headlineAccent")}</span>
            </h2>
            <p className="text-body text-foreground sm:text-[1.0625rem]">{t("mission.body1")}</p>
            <p className="text-body text-muted-foreground">{t("mission.body2")}</p>
          </div>

          <ul className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-control border border-border bg-border sm:grid-cols-2">
            {features.map(({ key, icon: Icon }) => (
              <li key={key} className="flex flex-col gap-2 bg-card p-5">
                <span aria-hidden className="mb-1 flex size-10 items-center justify-center rounded-plate bg-muted">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-body font-semibold">{t(`features.${key}.title`)}</h3>
                <p className="text-caption text-muted-foreground">{t(`features.${key}.description`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="values-title" className={`${container} pt-12 sm:pt-16`}>
        <SectionHeader id="values-title" title={t("values.heading")} subtitle={t("values.subtitle")} />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ key, icon: Icon }) => (
            <li key={key} className="flex flex-col gap-3">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full border-2 border-border-strong bg-marker">
                <Icon className="size-[22px]" />
              </span>
              <h3 className="text-h3 font-semibold">{t(`values.${key}.title`)}</h3>
              <p className="text-body text-muted-foreground">{t(`values.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-cta-title" className={`${container} pt-12 sm:pt-16`}>
        <div className="flex flex-col gap-6 rounded-sheet border border-border bg-card p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-[40rem] flex-col gap-2">
            <h2 id="about-cta-title" className="text-h2 font-extrabold">
              {t("cta.heading")}
            </h2>
            <p className="text-body text-muted-foreground">{t("cta.body")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <StartFreeButton label={t("cta.startTrial")} />
            <Link href="/contact" className={buttonVariants({ variant: "outline-strong", size: "xl" })}>
              {t("cta.contactUs")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
