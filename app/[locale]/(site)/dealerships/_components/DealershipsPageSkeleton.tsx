import { DealershipGridSkeleton } from "./DealershipSkeleton";

/**
 * Dealerships loading state — the same frame as the page (header with search,
 * filter bar, grid) so content replaces it without the layout jumping. Shown
 * by the route's loading.tsx and by the page's Suspense while its client part
 * loads, so the two hand over without a blank gap.
 */
export function DealershipsPageSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
      <div className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer h-9 w-56 rounded" />
          <div className="skeleton-shimmer h-4 w-64 rounded" />
        </div>
        <div className="skeleton-shimmer h-12 w-full max-w-xl rounded-control" />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="skeleton-shimmer h-5 w-40 rounded" />
        <div className="flex flex-wrap gap-2">
          <div className="skeleton-shimmer h-10 w-24 rounded-control" />
          <div className="skeleton-shimmer h-10 w-28 rounded-control" />
          <div className="skeleton-shimmer h-10 w-44 rounded-control" />
        </div>
      </div>

      <DealershipGridSkeleton count={8} />
    </div>
  );
}
