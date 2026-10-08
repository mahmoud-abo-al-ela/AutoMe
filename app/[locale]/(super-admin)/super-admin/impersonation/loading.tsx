/**
 * The support sessions on their way, in their own shape: the header with its
 * action, the view tabs, the toolbar, then the table's rows (cards below
 * laptop width). Shimmer, like every admin skeleton.
 */
export default function SessionsLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton-shimmer h-9 w-56 rounded" />
          <span className="skeleton-shimmer h-4 w-96 max-w-full rounded" />
        </div>
        <span className="skeleton-shimmer h-11 w-48 rounded-control" />
      </div>

      <div className="flex gap-4 overflow-hidden border-b border-border pb-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="skeleton-shimmer h-5 w-24 shrink-0 rounded" />
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <span className="skeleton-shimmer h-11 w-full rounded-control sm:max-w-[420px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[200px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[170px]" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <ul className="divide-y divide-border lg:hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex flex-col gap-2 px-4 py-3">
              <span className="flex justify-between gap-3">
                <span className="skeleton-shimmer h-4 w-36 rounded" />
                <span className="skeleton-shimmer h-4 w-16 rounded" />
              </span>
              <span className="skeleton-shimmer h-3 w-48 rounded" />
              <span className="skeleton-shimmer h-3 w-full rounded" />
              <span className="skeleton-shimmer h-10 w-full rounded-control" />
            </li>
          ))}
        </ul>
        <div className="hidden lg:block">
          <div className="h-11 border-b border-border bg-muted/60" />
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <li key={i} className="flex items-center gap-6 px-5 py-3.5">
                <span className="skeleton-shimmer h-4 w-24 rounded" />
                <span className="skeleton-shimmer h-4 w-24 rounded" />
                <span className="skeleton-shimmer h-4 w-32 rounded" />
                <span className="skeleton-shimmer h-4 w-28 rounded" />
                <span className="skeleton-shimmer h-4 flex-1 rounded" />
                <span className="skeleton-shimmer h-4 w-16 rounded" />
                <span className="skeleton-shimmer h-4 w-8 rounded" />
                <span className="skeleton-shimmer h-9 w-24 rounded-control" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
