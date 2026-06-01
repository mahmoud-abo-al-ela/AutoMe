import { getCars } from "@/actions/cars-listing";
import ClientPage from "./ClientPage";
import { Suspense } from "react";

export default async function BrowseCarsPage({ searchParams }) {
  const params = await searchParams;

  const filters = {
    search: params.search || undefined,
    make: params.make || undefined,
    bodyType: params.bodyType || undefined,
    fuelType: params.fuelType || undefined,
    transmission: params.transmission || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sortBy: params.sortBy || "newest",
    page: params.page ? Number(params.page) : 1,
  };

  const initialData = await getCars(filters);

  return (
    <Suspense>
      <ClientPage initialData={initialData} />
    </Suspense>
  );
}
