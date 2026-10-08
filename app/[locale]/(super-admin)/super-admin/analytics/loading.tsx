import { ReportSkeletonFromUrl } from "./_components/ReportSkeletons";

/**
 * Analytics on its way, in its own shape: the header with the period switch,
 * the report tabs, then the open report in its own shape, read from the URL.
 * Shimmer, like every admin skeleton.
 */
export default function AnalyticsLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton-shimmer h-9 w-44 rounded" />
          <span className="skeleton-shimmer h-4 w-[30rem] max-w-full rounded" />
        </div>
        <span className="skeleton-shimmer h-11 w-80 max-w-full rounded-control" />
      </div>

      <div className="flex gap-4 overflow-hidden border-b border-border pb-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="skeleton-shimmer h-5 w-24 shrink-0 rounded" />
        ))}
      </div>

      <ReportSkeletonFromUrl />
    </div>
  );
}
