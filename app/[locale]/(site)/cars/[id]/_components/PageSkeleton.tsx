/**
 * Car page loading state — the same grid as CarContent (gallery, price panel,
 * spec readout, tabs), so the page fills in without shifting.
 */
const PageSkeleton = () => (
  <div aria-busy="true" className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-4 sm:px-6 md:pt-6 xl:px-0">
    <div className="mb-5 hidden gap-2 md:flex">
      <div className="skeleton-shimmer h-4 w-12 rounded" />
      <div className="skeleton-shimmer h-4 w-12 rounded" />
      <div className="skeleton-shimmer h-4 w-40 rounded" />
    </div>

    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <div className="flex flex-col gap-3">
        <div className="skeleton-shimmer aspect-[16/10] w-full rounded-control" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer h-16 w-24 shrink-0 rounded-plate" />
          ))}
        </div>
      </div>

      <aside className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <div className="flex flex-col gap-5 rounded-control border border-border bg-card p-5 sm:p-6">
          <div className="skeleton-shimmer h-5 w-20 rounded" />
          <div className="skeleton-shimmer h-8 w-3/4 rounded" />
          <div className="skeleton-shimmer h-14 w-48 rounded-plate" />
          <div className="skeleton-shimmer h-10 w-full rounded" />
          <div className="skeleton-shimmer h-16 w-full rounded-control" />
          <div className="skeleton-shimmer h-12 w-full rounded-control" />
          <div className="skeleton-shimmer h-12 w-full rounded-control" />
        </div>
      </aside>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-control border border-border bg-border sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-2 bg-field p-3.5">
            <div className="skeleton-shimmer h-3 w-16 rounded" />
            <div className="skeleton-shimmer h-4 w-24 rounded" />
          </div>
        ))}
      </div>

      <div className="skeleton-shimmer h-64 w-full rounded-control" />
    </div>
  </div>
);

export default PageSkeleton;
