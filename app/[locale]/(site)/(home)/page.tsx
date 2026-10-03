/**
 * The hero photo search calls Gemini from here, and the vision models take
 * 7-17s. Vercel functions default to 10s, and a platform kill is the worst
 * failure available: the AI client's own ledger write never runs, so the
 * request is spent but invisible to the usage breaker, and the reader gets a
 * bare 504 instead of a typed error. The client budgets itself to 45s; this is
 * the ceiling that budget has to sit under.
 */
export const maxDuration = 60;

import Hero from "@/components/Hero/Hero";
import Featured from "@/components/FeaturedCars/Featured";
import Stats from "@/components/Stats/Stats";
import Testimonials from "@/components/Testimonials/Testimonials";
import Pricing from "@/components/Pricing/Pricing";
import FAQ from "@/components/FAQ/FAQ";
import { SectionHeader } from "@/components/Home/SectionHeader";
import { BodyTypeTiles } from "@/components/Home/BodyTypeTiles";
import { Features } from "@/components/Home/Features";
import { DealerBand } from "@/components/Home/DealerBand";
import { getActivePlans } from "@/actions/billing";
import { getCarsFilters, getMarketSummary } from "@/actions/cars-listing";
import { getFeaturedCars } from "@/actions/home";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils/number";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { cn } from "@/lib/utils";

/**
 * The tab title comes from the root layout's `title.default` (the
 * dealership's name on a subdomain), so none is set here — but Open Graph
 * does not inherit it, so the preview title is spelled out.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  const organization = await getCurrentOrganization();
  const meta = await localizedPageMetadata("/", locale as Locale, {
    tenantScoped: true,
  });

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      // Mirrors the root layout's tab title and description.
      title: organization?.name ?? t("title"),
      description: organization
        ? organization.description || `${organization.name} — AutoMe`
        : t("description"),
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const organization = await getCurrentOrganization();
  const isOnSubdomain = !!organization;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home");

  // Everything the page states about the stock is read live, in parallel. A
  // failed read drops its section (or its numbers) rather than the page.
  const [summaryResponse, filtersResponse, featuredResponse, plansResponse] = await Promise.all([
    getMarketSummary(),
    getCarsFilters({}),
    getFeaturedCars(4),
    // The whole ActionResponse envelope used to be handed to <Pricing>, whose
    // `dbPlans.length > 0` check read undefined on it and quietly fell through
    // to the hardcoded default plans — so the homepage never showed real pricing.
    isOnSubdomain ? null : getActivePlans(),
  ]);
  const summary = summaryResponse.success ? summaryResponse.data : null;
  const bodyTypes = filtersResponse.success
    ? [...filtersResponse.data.bodyTypes].sort((a, b) => b.count - a.count).slice(0, 5)
    : [];
  const featured = featuredResponse.success ? featuredResponse.data : [];
  const plans = plansResponse?.success ? plansResponse.data : null;
  const brandName = organization?.name || "AutoMe";

  return (
    <div className="flex flex-col">
      <Hero summary={summary} />

      {bodyTypes.length > 0 && (
        <HomeSection labelledBy="body-title">
          <SectionHeader
            id="body-title"
            title={t("body.title")}
            action={
              summary
                ? { href: "/cars", label: t("body.allCars", { value: formatNumber(summary.listings, locale) }) }
                : undefined
            }
          />
          <BodyTypeTiles items={bodyTypes} />
        </HomeSection>
      )}

      {featured.length > 0 && (
        <HomeSection labelledBy="featured-title">
          <SectionHeader
            id="featured-title"
            title={t("featured.title")}
            subtitle={t("featured.subtitle")}
            action={{ href: "/cars", label: t("featured.viewAll") }}
          />
          <Featured cars={featured} />
        </HomeSection>
      )}

      <HomeSection labelledBy="features-title">
        <SectionHeader id="features-title" title={t("features.title")} />
        <Features />
      </HomeSection>

      <HomeSection>
        <Stats />
      </HomeSection>

      <HomeSection>
        <Testimonials brand={brandName} />
      </HomeSection>

      {!isOnSubdomain && (
        <HomeSection id="for-dealers" labelledBy="for-dealers-title" className="scroll-mt-24">
          <DealerBand />
          <Pricing plans={plans} />
        </HomeSection>
      )}

      <HomeSection className="pb-16 sm:pb-24">
        <FAQ brandName={brandName} />
      </HomeSection>
    </div>
  );
}

/** One home-page band: shared width, gutters and vertical rhythm. */
function HomeSection({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("mx-auto w-full max-w-[1360px] px-4 pt-12 sm:px-6 sm:pt-16 xl:px-0", className)}
    >
      {children}
    </section>
  );
}
