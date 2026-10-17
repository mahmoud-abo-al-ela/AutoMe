import CarCardSkeleton from "@/components/CarCardSkeleton";

export function CarsPageSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
      <div className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
        <div className="skeleton-shimmer h-9 w-56 rounded" />
        <div className="skeleton-shimmer h-12 w-full max-w-xl rounded-control" />
      </div>

      <div className="flex gap-6">
        <div className="hidden w-[296px] shrink-0 flex-col gap-4 rounded-control border border-border bg-card p-4 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="skeleton-shimmer h-4 w-28 rounded" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="skeleton-shimmer h-9 w-16 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="skeleton-shimmer h-6 w-24 rounded" />
            <div className="skeleton-shimmer h-10 w-44 rounded-control" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
