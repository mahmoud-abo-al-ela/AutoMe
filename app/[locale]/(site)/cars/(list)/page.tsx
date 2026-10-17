import { getCars } from "@/actions/cars-listing";
import ClientPage from "./ClientPage";
import { CarsPageSkeleton } from "./_components/CarsPageSkeleton";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { parseFiltersFromSearch } from "@/hooks/cars-page-filters";

type SearchParams = Record<string, string | string[] | undefined>;

function queryString(params: SearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) query.set(key, first);
  }
  return query.toString();
}

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
