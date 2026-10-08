/**
 * Adding a dealership, on its way, in its own shape: back link, the header,
 * the three steps (a slim bar on a phone), then the first step's fields and
 * the buttons. Shimmer, like every admin skeleton.
 */
export default function CreateDealershipLoading() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <span className="skeleton-shimmer h-4 w-28 rounded" />
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <span className="skeleton-shimmer h-9 w-56 rounded" />
        <span className="skeleton-shimmer h-4 w-96 max-w-full rounded" />
      </div>

      <div className="flex gap-1.5 sm:hidden">
        {[0, 1, 2].map((i) => (
          <span key={i} className="skeleton-shimmer h-1.5 flex-1 rounded-full" />
        ))}
      </div>
      <div className="hidden grid-cols-3 gap-3 sm:grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-2.5">
            <span className="skeleton-shimmer size-8 shrink-0 rounded-full" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="skeleton-shimmer h-3.5 w-28 rounded" />
              <span className="skeleton-shimmer h-3 w-20 rounded" />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 rounded-[20px] border border-border bg-card px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2">
          <span className="skeleton-shimmer h-3 w-20 rounded" />
          <span className="skeleton-shimmer h-6 w-40 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="skeleton-shimmer h-3.5 w-24 rounded" />
              <span className="skeleton-shimmer h-11 w-full rounded-control" />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="skeleton-shimmer h-3.5 w-36 rounded" />
            <span className="skeleton-shimmer h-[84px] w-full rounded-control" />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <span className="skeleton-shimmer h-11 w-28 rounded-control" />
        <span className="skeleton-shimmer h-11 w-40 rounded-control" />
      </div>
    </div>
  );
}
