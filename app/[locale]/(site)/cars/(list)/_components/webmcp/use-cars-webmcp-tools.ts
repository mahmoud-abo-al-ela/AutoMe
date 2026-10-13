"use client";

import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import type { getCars } from "@/actions/cars-listing";
import type { useCarsPage } from "@/hooks/use-cars-page";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { findPublicCarsByIds } from "@/hooks/webmcp-public-cars";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/query-client";
import { carsPageTools } from "./cars-tools";

/** Longer than any search the page runs; past it the agent is told the search failed. */
const LIST_TIMEOUT_MS = 15_000;

/**
 * The page's own query for a key, once it has settled. The tool does not
 * fetch: it waits for the list the page fetches for the filters it just
 * applied, so what it returns is the cards on the screen, from one request.
 */
function settledQuery<T>(client: QueryClient, queryKey: QueryKey): Promise<T> {
  const cache = client.getQueryCache();
  return new Promise<T>((resolve, reject) => {
    const settle = () => {
      const query = cache.find({ queryKey, exact: true });
      if (!query || query.state.fetchStatus !== "idle") return;
      if (query.state.status === "success") finish(() => resolve(query.state.data as T));
      else if (query.state.status === "error") finish(() => reject(query.state.error));
    };
    const unsubscribe = cache.subscribe(settle);
    const timer = setTimeout(() => finish(() => reject(new Error("The cars list did not load in time"))), LIST_TIMEOUT_MS);
    function finish(outcome: () => void) {
      unsubscribe();
      clearTimeout(timer);
      outcome();
    }
    settle();
  });
}

/**
 * Offer the cars page's tools (./cars-tools.ts) to a browser agent, wired to
 * the page itself: its filters, its React Query list, the locale-aware router.
 */
export function useCarsWebMcpTools(page: ReturnType<typeof useCarsPage>): void {
  const queryClient = useQueryClient();
  const router = useRouter();

  useWebMcpTools(
    carsPageTools({
      applyFilters: (filters) => page.handlers.applyFilters(filters),
      loadFirstPage: async (filters) => {
        const response = await settledQuery<Awaited<ReturnType<typeof getCars>>>(
          queryClient,
          queryKeys.cars.list({ ...filters, page: 1, perPage: page.perPage })
        );
        if (!response.success) throw new Error(response.error.message);
        return { cars: response.data.cars.filter((car) => car !== null), total: response.data.pagination.total };
      },
      findPublicCars: findPublicCarsByIds,
      navigateToCar: (id) => router.push(`/cars/${id}`),
    })
  );
}
