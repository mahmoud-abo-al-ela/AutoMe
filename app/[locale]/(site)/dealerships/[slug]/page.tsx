import { cache } from "react";
import { after } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import * as dealershipService from "@/lib/services/dealership";
import { mcpReferralMedium, recordMcpReferral } from "@/lib/services/mcp/referrals";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { dealershipTranslationPlan, resolveDealershipText } from "@/lib/utils/dealership-text";
import { StructuredData } from "@/lib/utils/seo";
import { breadcrumbStructuredData, dealershipStructuredData } from "@/lib/utils/structured-data";
import { cityName, governorateName } from "@/lib/locations/names";
import { fitsTitle } from "@/lib/utils/seo-meta";
import { DealershipPage } from "./_components/DealershipPage";
import {
    DEALERSHIP_CARS_PER_PAGE,
    DEALERSHIP_TABS,
    type DealershipCar,
    type DealershipTab,
} from "./_lib/detail-types";

/**
 * One lookup per request, shared by the metadata and the page. A missing or
 * inactive dealership is null (the page answers 404); anything else throws to
 * the error boundary.
 */
const loadDealership = cache(async (slug: string) => {
    try {
        return await dealershipService.getDealershipBySlug(slug);
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) return null;
        throw error;
    }
});

type PageProps = {
    params: Promise<{ slug: string; locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<PageProps, "params">): Promise<Metadata> {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: "dealerships.meta" });
    const dealership = await loadDealership(slug);

    if (!dealership) {
        // Said outright, not left to the not-found page: the response may
        // already be a 200 by the time it renders (the layout streams).
        return { title: t("notFoundTitle"), description: t("notFoundDescription"), robots: { index: false } };
    }

    const { name, city, region, logo, carCount } = dealership;
    // In the page's language when the translation exists.
    const description = resolveDealershipText(dealership, "description", locale as Locale)?.text;
    // "Nile Crest Motors — car dealership in New Cairo": what the business is
    // and where, the two things a search for a dealer near you matches on. The
    // bare name when there is no city, or when the result would be cut off.
    const place = cityName(city, locale as Locale);
    const placed = place ? t("detailTitle", { name, place }) : name;
    const title = fitsTitle(placed) ? placed : name;
    // The tab title gets the brand from the root title.template; og/twitter
    // titles do not inherit it, so they spell the brand out themselves.
    const socialTitle = title + " | AutoMe";
    const desc =
        description ||
        t("detailDescription", {
            name,
            count: carCount || 0,
            value: formatNumber(carCount || 0, locale as Locale),
        });

    const meta = await localizedPageMetadata(`/dealerships/${slug}`, locale as Locale, {
        title,
        description: desc,
    });

    return {
        ...meta,
        keywords: [name, t("keywords"), city, region].filter(Boolean).join(", "),
        openGraph: {
            ...meta.openGraph,
            title: socialTitle,
            description: desc,
            type: "website",
            // Without a logo the site's default share image (opengraph-image) applies.
            ...(logo && { images: [{ url: logo, alt: name }] }),
        },
        twitter: {
            ...meta.twitter,
            title: socialTitle,
            description: desc,
            ...(logo && { images: [logo] }),
        },
    };
}

/**
 * A dealership's storefront. Rendered on the server — the dealership, its
 * first page of cars and the filter options — so the page arrives whole
 * (and readable by search engines) instead of as a skeleton that fetched
 * everything after load. Filtering and paging then run in the browser.
 */
export default async function DealershipDetailPage({ params, searchParams }: PageProps) {
    const { slug, locale } = await params;
    const dealership = await loadDealership(slug);
    if (!dealership) notFound();

    // A visit from an MCP answer's link, counted after the response, now that
    // the dealership is found.
    const mcpMedium = mcpReferralMedium(await searchParams);
    if (mcpMedium) after(() => recordMcpReferral("dealership", dealership.slug, mcpMedium));

    // A description or address saved before translation existed (or whose
    // translation failed) is translated after this response — nobody waits on it, and the
    // next visitor reads it in their language. Billed to no one (see
    // AI_FEATURES.dealershipProfileTranslation).
    if (dealershipTranslationPlan(dealership).length > 0) {
        after(() =>
            dealershipService.syncDealershipProfileTextFromStorefront(dealership.id, {
                organizationId: dealership.id,
                userId: null,
                priority: "low",
            })
        );
    }

    const [carsResult, filterOptions, t] = await Promise.all([
        dealershipService.getDealershipCars(
            dealership.id,
            { sortBy: "newest" },
            { page: 1, limit: DEALERSHIP_CARS_PER_PAGE }
        ),
        dealershipService.getDealershipCarFilters(dealership.id),
        getTranslations({ locale, namespace: "dealerships.breadcrumb" }),
    ]);

    const requestedTab = (await searchParams).tab;
    const initialTab: DealershipTab = DEALERSHIP_TABS.includes(requestedTab as DealershipTab)
        ? (requestedTab as DealershipTab)
        : "cars";

    return (
        <>
            <StructuredData
                data={dealershipStructuredData(
                    {
                        ...dealership,
                        description: resolveDealershipText(dealership, "description", locale as Locale)?.text,
                        address: resolveDealershipText(dealership, "address", locale as Locale)?.text,
                        city: cityName(dealership.city, locale as Locale),
                        region: governorateName(dealership.region, locale as Locale),
                    },
                    locale as Locale
                )}
            />
            <StructuredData
                data={breadcrumbStructuredData(
                    [
                        { name: t("home"), path: "/" },
                        { name: t("dealerships"), path: "/dealerships" },
                        { name: dealership.name, path: `/dealerships/${dealership.slug}` },
                    ],
                    locale as Locale
                )}
            />
            <DealershipPage
                dealership={dealership}
                // The serializer can yield null entries; a card would crash on one.
                initialCars={carsResult.cars.filter((car): car is DealershipCar => car !== null)}
                initialPagination={carsResult.pagination}
                filterOptions={filterOptions}
                initialTab={initialTab}
            />
        </>
    );
}
