import { cache } from "react";
import { after } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import * as dealershipService from "@/lib/services/dealership";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { dealershipTranslationPlan, resolveDealershipText } from "@/lib/utils/dealership-text";
import {
    generateBreadcrumbStructuredData,
    generateDealershipStructuredData,
    StructuredData,
} from "@/lib/utils/seo";
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
    searchParams: Promise<{ tab?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<PageProps, "params">): Promise<Metadata> {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: "dealerships.meta" });
    const dealership = await loadDealership(slug);

    if (!dealership) {
        return { title: t("notFoundTitle"), description: t("notFoundDescription") };
    }

    const { name, city, region, logo, carCount } = dealership;
    // In the page's language when the translation exists.
    const description = resolveDealershipText(dealership, "description", locale as Locale)?.text;
    // The tab title gets the brand from the root title.template; og/twitter
    // titles do not inherit it, so they spell the brand out themselves.
    const socialTitle = name + " | AutoMe";
    const desc =
        description ||
        t("detailDescription", {
            name,
            count: carCount || 0,
            value: formatNumber(carCount || 0, locale as Locale),
        });

    const meta = await localizedPageMetadata(`/dealerships/${slug}`, locale as Locale, {
        title: name,
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
            images: [{ url: logo || "/og-image.jpg", width: 1200, height: 630, alt: `${name} logo` }],
        },
        twitter: {
            card: "summary_large_image",
            title: socialTitle,
            description: desc,
            images: [logo || "/og-image.jpg"],
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

    // A description or address saved before translation existed (or whose
    // translation failed) is translated after this response — nobody waits on it, and the
    // next visitor reads it in their language. Billed to no one (see
    // AI_FEATURES.dealershipProfileTranslation).
    if (dealershipTranslationPlan(dealership).length > 0) {
        after(() =>
            dealershipService.syncDealershipProfileText(dealership.id, {
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
            <StructuredData data={generateDealershipStructuredData(dealership)} />
            <StructuredData
                data={generateBreadcrumbStructuredData([
                    { name: t("home"), url: "/" },
                    { name: t("dealerships"), url: "/dealerships" },
                    { name: dealership.name, url: `/dealerships/${dealership.slug}` },
                ])}
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
