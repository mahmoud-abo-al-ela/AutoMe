import { getCars } from "@/actions/cars-listing";
import ClientPage from "./ClientPage";
import { Suspense } from "react";
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";

const csv = (v) =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
const num = (v) => (v ? Number(v) : undefined);

export default async function BrowseCarsPage({ searchParams }) {
  const params = await searchParams;
  const perPage = num(params.perPage) || DEFAULT_PER_PAGE;
  const page = num(params.page) || 1;

  const filters = {
    search: params.search || undefined,
    make: csv(params.make),
    bodyType: csv(params.bodyType),
    fuelType: csv(params.fuelType),
    transmission: csv(params.transmission),
    dealership: params.dealership || undefined,
    city: params.city || undefined,
    // Keep this map in sync with parseFiltersFromSearch in hooks/cars-page-filters.js.
    color: params.color || undefined,
    minSeats: num(params.minSeats),
    minPrice: num(params.minPrice),
    maxPrice: num(params.maxPrice),
    minYear: num(params.minYear),
    maxYear: num(params.maxYear),
    minMileage: num(params.minMileage),
    maxMileage: num(params.maxMileage),
    sortBy: params.sortBy || "newest",
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
