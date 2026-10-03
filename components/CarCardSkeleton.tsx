/**
 * Loading placeholder with CarCard's exact proportions at every width (Figma:
 * CarCard / Skeleton), so results replace it without the grid shifting.
 */
const CarCardSkeleton = () => (
  <div aria-hidden className="flex h-full flex-col overflow-hidden rounded-control border border-border bg-card">
    <div className="skeleton-shimmer aspect-[4/3] sm:aspect-[3/2]" />
    <div className="flex flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
      <div className="skeleton-shimmer h-4 w-3/4 rounded" />
      <div className="skeleton-shimmer h-3.5 w-1/2 rounded" />
      <div className="skeleton-shimmer h-3 w-2/5 rounded" />
      <div className="skeleton-shimmer mt-1 h-3 w-3/5 rounded max-sm:hidden" />
    </div>
  </div>
);

export default CarCardSkeleton;
