/**
 * A settings tab on its way: panels in the shape of the storefront form. The
 * header and tabs belong to the layout, so they stay put while this shows.
 */
export default function SettingsLoading() {
  return (
    <div aria-busy className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="flex flex-col gap-5">
        {[4, 2, 3].map((rows, i) => (
          <div key={i} className="rounded-[20px] border border-border bg-card">
            <div className="border-b border-border px-[22px] py-4">
              <span className="skeleton-shimmer block h-6 w-40 rounded" />
            </div>
            <div className="grid gap-4 px-[22px] py-[18px] sm:grid-cols-2">
              {Array.from({ length: rows }, (_, j) => (
                <span key={j} className="flex flex-col gap-2">
                  <span className="skeleton-shimmer h-3.5 w-24 rounded" />
                  <span className="skeleton-shimmer h-11 rounded-control" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="skeleton-shimmer hidden h-[420px] rounded-[18px] lg:block" />
    </div>
  );
}
