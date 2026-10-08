/**
 * The overview on its way, in its own shape: the header with the period and
 * comparison, the five number tabs over the chart, the three cards, then the
 * needs-attention table. Shimmer, like the dealer pages' skeletons. Shown by
 * the overview's own loading boundary and, on a reload, by the locale root's.
 */
export function OverviewSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <span className="skeleton-shimmer h-9 w-48 rounded" />
        <div className="flex gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="skeleton-shimmer h-4 w-20 rounded" />
              <span className="skeleton-shimmer h-11 w-44 rounded-control" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="flex overflow-hidden border-b border-border lg:grid lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex min-w-[168px] flex-col gap-2 border-s border-border px-4 pb-3.5 pt-4 first:border-s-0 sm:px-5 lg:min-w-0">
              <span className="skeleton-shimmer h-3.5 w-28 rounded" />
              <span className="skeleton-shimmer h-7 w-24 rounded" />
              <span className="skeleton-shimmer h-3 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 px-4 pb-4 pt-4 sm:px-5">
          <span className="skeleton-shimmer h-4 w-56 rounded" />
          <span className="skeleton-shimmer h-[220px] w-full rounded-[12px] sm:h-[280px]" />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[20px] border border-border bg-card">
            <div className="border-b border-border px-4 py-4 sm:px-[22px]">
              <span className="skeleton-shimmer block h-6 w-40 rounded" />
            </div>
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-[22px] sm:py-[18px]">
              {[0, 1, 2].map((j) => (
                <span key={j} className="skeleton-shimmer h-3 w-full rounded-full" />
              ))}
              <span className="skeleton-shimmer h-4 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="px-4 py-4 sm:px-5">
          <span className="skeleton-shimmer block h-6 w-44 rounded" />
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3">
              <span className="skeleton-shimmer h-5 w-28 rounded-full" />
              <span className="skeleton-shimmer h-4 w-32 rounded" />
              <span className="skeleton-shimmer hidden h-4 flex-1 rounded md:block" />
              <span className="skeleton-shimmer ms-auto h-10 w-20 rounded-control" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
