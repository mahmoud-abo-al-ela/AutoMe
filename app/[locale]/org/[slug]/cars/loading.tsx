import { LedgerSkeleton } from "./_components/ledger/CarsLedger";

/**
 * The Cars page while it loads, in the page's own shape: title, views,
 * toolbar, and the table's frame with the same skeleton rows the table uses,
 * so the page fills in rather than swapping one placeholder for another.
 */
export default function CarsLoading() {
  return (
    <div aria-busy className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <span className="skeleton-shimmer h-10 w-40 rounded" />
        <span className="skeleton-shimmer h-4 w-56 rounded" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[72, 96, 140, 88, 76].map((width, i) => (
          <span key={i} className="skeleton-shimmer h-11 shrink-0 rounded-full" style={{ width }} />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <span className="skeleton-shimmer h-11 w-full rounded-control sm:max-w-md" />
        <span className="skeleton-shimmer h-11 w-28 rounded-control" />
        <span className="skeleton-shimmer ms-auto hidden h-11 w-32 rounded-control sm:block" />
      </div>
      <div className="overflow-hidden rounded-sheet border border-border bg-card">
        <LedgerSkeleton />
      </div>
    </div>
  );
}
