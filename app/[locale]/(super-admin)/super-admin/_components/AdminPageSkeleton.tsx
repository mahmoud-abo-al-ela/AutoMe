/**
 * An admin page on its way, before it has a skeleton of its own: the page
 * header, then one panel of rows. Shimmer, like the overview's skeleton.
 */
export function AdminPageSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <span className="skeleton-shimmer h-9 w-64 max-w-full rounded" />
        <span className="skeleton-shimmer h-4 w-80 max-w-full rounded" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <span className="skeleton-shimmer h-10 w-72 max-w-full rounded-control" />
          <span className="skeleton-shimmer hidden h-10 w-32 rounded-control sm:block" />
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <span className="skeleton-shimmer h-4 w-1/3 rounded" />
              <span className="skeleton-shimmer ms-auto h-4 w-20 rounded" />
              <span className="skeleton-shimmer hidden h-4 w-16 rounded sm:block" />
              <span className="skeleton-shimmer h-4 w-24 rounded" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
