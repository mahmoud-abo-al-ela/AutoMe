/**
 * The plans page on its way, in its own shape: the header, the four billing
 * numbers, then the comparison — three plan columns over their rows on a
 * laptop, a card per plan below that. Shimmer, like every admin skeleton.
 */
export default function PlansLoading() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5">
        <span className="skeleton-shimmer h-9 w-40 rounded" />
        <span className="skeleton-shimmer h-4 w-[28rem] max-w-full rounded" />
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-border bg-card lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 border-border p-4 odd:border-e sm:px-5 lg:border-e lg:last:border-e-0 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0">
            <span className="skeleton-shimmer h-3.5 w-28 rounded" />
            <span className="skeleton-shimmer h-7 w-24 rounded" />
            <span className="skeleton-shimmer h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Phones and tablets: one card per plan, as the page draws them. */}
      <div className="grid gap-4 md:grid-cols-2 lg:hidden">
        {[0, 1, 2].map((card) => (
          <div key={card} className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4">
            <span className="skeleton-shimmer h-6 w-32 rounded" />
            <span className="skeleton-shimmer h-3.5 w-36 rounded" />
            <div className="flex flex-col divide-y divide-border">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <span key={row} className="flex items-center justify-between py-2.5">
                  <span className="skeleton-shimmer h-3.5 w-28 rounded" />
                  <span className="skeleton-shimmer h-3.5 w-16 rounded" />
                </span>
              ))}
            </div>
            <span className="skeleton-shimmer h-10 w-full rounded-control" />
          </div>
        ))}
      </div>

      {/* Laptops: the comparison table. */}
      <div className="hidden overflow-hidden rounded-[20px] border border-border bg-card lg:block">
        <div className="grid grid-cols-[26%_1fr_1fr_1fr] border-b border-border">
          <span />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-4 py-4">
              <span className="skeleton-shimmer h-6 w-28 rounded" />
              <span className="skeleton-shimmer h-3.5 w-24 rounded" />
              <span className="skeleton-shimmer mt-1 h-9 w-20 rounded-control" />
            </div>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
          <div key={row} className="grid grid-cols-[26%_1fr_1fr_1fr] items-center border-b border-border last:border-b-0">
            <span className="px-5 py-3.5">
              <span className="skeleton-shimmer block h-4 w-32 rounded" />
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex justify-center px-4 py-3.5">
                <span className="skeleton-shimmer h-4 w-20 rounded" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
