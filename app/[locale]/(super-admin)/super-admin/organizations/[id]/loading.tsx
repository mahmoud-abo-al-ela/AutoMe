import { DealershipTabSkeletonFromUrl } from "./_components/TabSkeletons";

/**
 * A dealership's page on its way, in its own shape: back link, the name and
 * actions, the tabs, then the open tab in its own shape, read from the URL.
 * Shimmer, like every admin skeleton.
 */
export default function DealershipLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <span className="skeleton-shimmer h-4 w-28 rounded" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="skeleton-shimmer size-16 shrink-0 rounded-[16px]" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="skeleton-shimmer h-8 w-64 max-w-full rounded" />
          <span className="skeleton-shimmer h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex gap-2">
          <span className="skeleton-shimmer h-11 w-44 rounded-control" />
          <span className="skeleton-shimmer h-11 w-24 rounded-control" />
        </div>
      </div>
      <div className="flex gap-5 border-b border-border pb-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="skeleton-shimmer h-5 w-20 rounded" />
        ))}
      </div>
      <DealershipTabSkeletonFromUrl />
    </div>
  );
}
