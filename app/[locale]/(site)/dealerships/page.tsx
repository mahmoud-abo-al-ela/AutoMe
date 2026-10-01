import { Suspense } from "react";
import { getDealerships } from "@/actions/dealerships";
import { parseFiltersFromSearch } from "@/hooks/dealerships-url";
import ClientPage from "./ClientPage";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";

/**
 * Canonical to the bare listing, as with /cars, whatever the filters.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "dealerships.meta" });
    const meta = await localizedPageMetadata("/dealerships", locale as Locale, {
        title: t("title"),
        description: t("description"),
    });

    return {
        ...meta,
        openGraph: { ...meta.openGraph, description: t("ogDescription") },
    };
}

export default async function DealershipsPage({
    params: routeParams,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { locale } = await routeParams;

    const params = await searchParams;

    // Reuse the client parser by rebuilding a query string from the params
    // object, so server and client derive identical initial state.
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
        if (value == null) continue;
        sp.set(key, Array.isArray(value) ? value[0] : value);
    }

    const { filters, page, perPage } = parseFiltersFromSearch(sp.toString());

    const initialData = await getDealerships(filters, { page, limit: perPage });

    return (
        <Suspense>
            <ClientPage
                initialData={initialData}
                initialState={{ filters, page, perPage }}
            />
        </Suspense>
    );
}
