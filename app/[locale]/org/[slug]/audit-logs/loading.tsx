/** Activity on its way: the header, the filters, then a day of entries. */
export default function ActivityLoading() {
  return (
    <div aria-busy className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <span className="skeleton-shimmer h-9 w-40 rounded" />
        <span className="skeleton-shimmer h-4 w-80 rounded" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="skeleton-shimmer h-10 w-24 rounded-full" />
        ))}
      </div>
      <span className="skeleton-shimmer h-4 w-24 rounded" />
      <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-3.5 border-t border-border px-5 py-4 first:border-t-0">
            <span className="skeleton-shimmer size-10 shrink-0 rounded-full" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="skeleton-shimmer h-4 w-2/3 rounded" />
              <span className="skeleton-shimmer h-6 w-1/3 rounded-control" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
