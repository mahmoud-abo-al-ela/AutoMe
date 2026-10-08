/**
 * The users list on its way, in its own shape: the header with its
 * action, the toolbar with its account dropdown, then the table's rows. Shimmer, like
 * every admin skeleton.
 */
export default function UsersLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="skeleton-shimmer h-9 w-52 rounded" />
          <span className="skeleton-shimmer h-4 w-80 max-w-full rounded" />
        </div>
        <div className="flex gap-2">
          <span className="skeleton-shimmer h-11 w-32 rounded-control" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <span className="skeleton-shimmer h-11 w-full max-w-[440px] rounded-control" />
        <span className="skeleton-shimmer h-11 w-[220px] rounded-control" />
        <span className="skeleton-shimmer h-11 w-40 rounded-control" />
        <span className="skeleton-shimmer h-11 w-48 rounded-control" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="h-11 border-b border-border bg-muted/60" />
        <ul className="divide-y divide-border">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <span className="skeleton-shimmer size-10 shrink-0 rounded-[10px]" />
              <span className="flex w-48 flex-col gap-1.5">
                <span className="skeleton-shimmer h-4 w-36 rounded" />
                <span className="skeleton-shimmer h-3 w-24 rounded" />
              </span>
              <span className="skeleton-shimmer hidden h-4 w-24 rounded md:block" />
              <span className="skeleton-shimmer h-5 w-28 rounded-full" />
              <span className="skeleton-shimmer ms-auto hidden h-4 w-48 rounded md:block" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
