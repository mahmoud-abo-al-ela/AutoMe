import { Suspense } from "react";
import { getDealerships } from "@/actions/dealerships";
import { parseFiltersFromSearch } from "@/hooks/dealerships-url";
import ClientPage from "./ClientPage";

export default async function DealershipsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
