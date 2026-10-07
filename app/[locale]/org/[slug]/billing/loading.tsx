/** Billing on its way: the header, then three plan columns in their final shape. */
export default function BillingLoading() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <span className="skeleton-shimmer h-9 w-40 rounded" />
        <span className="skeleton-shimmer h-4 w-72 rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex w-[85%] shrink-0 flex-col gap-4 rounded-[20px] border border-border bg-card p-[22px] md:w-auto">
            <span className="skeleton-shimmer h-6 w-32 rounded" />
            <span className="skeleton-shimmer h-9 w-40 rounded" />
            {[0, 1, 2, 3, 4].map((j) => (
              <span key={j} className="skeleton-shimmer h-4 w-3/4 rounded" />
            ))}
            <span className="skeleton-shimmer mt-2 h-12 rounded-control" />
          </div>
        ))}
      </div>
    </div>
  );
}
