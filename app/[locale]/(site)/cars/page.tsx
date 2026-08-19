import { getCars } from "@/actions/cars-listing";
import ClientPage from "./ClientPage";
import { Suspense } from "react";
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";

type SearchParams = Record<string, string | string[] | undefined>;

/** Repeated query keys arrive as arrays; the filter UI only ever sets one value. */
const one = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const csv = (v: string | string[] | undefined) => {
  const value = one(v);
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
};
const num = (v: string | string[] | undefined) => {
  const value = one(v);
  return value ? Number(value) : undefined;
};

export default async function BrowseCarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const perPage = num(params.perPage) || DEFAULT_PER_PAGE;
  const page = num(params.page) || 1;

  const filters = {
    search: one(params.search) || undefined,
    make: csv(params.make),
    bodyType: csv(params.bodyType),
    fuelType: csv(params.fuelType),
    transmission: csv(params.transmission),
    dealership: one(params.dealership) || undefined,
    city: one(params.city) || undefined,
    // Keep this map in sync with parseFiltersFromSearch in hooks/cars-page-filters.js.
    color: one(params.color) || undefined,
    minSeats: num(params.minSeats),
    minPrice: num(params.minPrice),
    maxPrice: num(params.maxPrice),
    minYear: num(params.minYear),
    maxYear: num(params.maxYear),
    minMileage: num(params.minMileage),
    maxMileage: num(params.maxMileage),
    sortBy: one(params.sortBy) || "newest",
  };

  const initialData = await getCars({ ...filters, page, limit: perPage });

  return (
    <Suspense>
      <ClientPage
        initialData={initialData}
        initialState={{ filters, page, perPage }}
      />
    </Suspense>
  );
}
