import { getCars } from "@/actions/cars-listing";
import ClientPage from "./ClientPage";
import { CarsPageSkeleton } from "./_components/CarsPageSkeleton";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { parseFiltersFromSearch } from "@/hooks/cars-page-filters";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The query string again, for the one parser the page's own URL state uses —
 * so the server's first render and the client cannot read a URL differently
 * (a copy of the parser here once missed `exact`). Repeated keys arrive as
 * arrays; the filter UI only ever sets one value, so the first is kept.
 */
function queryString(params: SearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) query.set(key, first);
  }
  return query.toString();
}

/**
 * The canonical is the bare listing, whatever the filters. Every filter
 * combination is a distinct URL over the same stock; indexing each one would
 * split the page's ranking across thousands of near-duplicates. On a
 * dealership subdomain the list is that dealership's stock, so it is
 * canonical there rather than on the marketplace.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cars.meta" });

  return localizedPageMetadata("/cars", locale as Locale, {
    title: t("title"),
    description: t("description"),
    tenantScoped: true,
  });
}

export default async function BrowseCarsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await routeParams;

  const { filters, page, perPage } = parseFiltersFromSearch(queryString(await searchParams));

  const initialData = await getCars({ ...filters, page, limit: perPage });

  return (
    <Suspense fallback={<CarsPageSkeleton />}>
      <ClientPage
        initialData={initialData}
        initialState={{ filters, page, perPage }}
      />
    </Suspense>
  );
}
