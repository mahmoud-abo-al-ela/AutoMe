/**
 * The activity on its way, in its own shape: the header with its export, the
 * toolbar, then the table's rows (cards below laptop width). Shimmer, like
 * every admin skeleton.
 */
export default function ActivityLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton-shimmer h-9 w-40 rounded" />
          <span className="skeleton-shimmer h-4 w-[30rem] max-w-full rounded" />
        </div>
        <span className="skeleton-shimmer h-11 w-36 rounded-control" />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <span className="skeleton-shimmer h-11 w-full rounded-control xl:max-w-[380px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[210px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[190px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[210px]" />
        <span className="skeleton-shimmer h-11 w-[calc(50%-0.3125rem)] rounded-control sm:w-[170px]" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <ul className="divide-y divide-border lg:hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex flex-col gap-2 px-4 py-3">
              <span className="flex justify-between gap-3">
                <span className="skeleton-shimmer h-4 w-32 rounded" />
                <span className="skeleton-shimmer h-3 w-20 rounded" />
              </span>
              <span className="skeleton-shimmer h-3 w-56 rounded" />
              <span className="skeleton-shimmer h-5 w-20 rounded-full" />
              <span className="skeleton-shimmer h-10 w-full rounded-control" />
            </li>
          ))}
        </ul>
        <div className="hidden lg:block">
          <div className="h-11 border-b border-border bg-muted/60" />
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <li key={i} className="flex items-center gap-6 px-5 py-3.5">
                <span className="skeleton-shimmer h-4 w-28 rounded" />
                <span className="skeleton-shimmer h-4 w-28 rounded" />
                <span className="skeleton-shimmer h-4 w-28 rounded" />
                <span className="skeleton-shimmer h-4 flex-1 rounded" />
                <span className="skeleton-shimmer h-4 w-28 rounded" />
                <span className="skeleton-shimmer h-5 w-24 rounded-full" />
                <span className="skeleton-shimmer h-9 w-24 rounded-control" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
