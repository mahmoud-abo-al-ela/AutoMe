/**
 * The Test drives page while it loads, in its own shape: the heading, the
 * month on the side, the day beside it — so the page fills in rather than
 * swapping one placeholder for another.
 */
export default function TestDrivesLoading() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <span className="skeleton-shimmer h-10 w-56 rounded" />
        <span className="skeleton-shimmer h-4 w-80 max-w-full rounded" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <span className="skeleton-shimmer h-36 rounded-sheet lg:h-[22rem]" />
        <div className="flex flex-col gap-3 rounded-sheet border border-border bg-card p-6">
          <span className="skeleton-shimmer h-8 w-2/3 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton-shimmer h-16 rounded-control" />
          ))}
        </div>
      </div>
    </div>
  );
}
