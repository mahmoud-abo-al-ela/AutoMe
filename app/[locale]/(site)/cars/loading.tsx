import CarCardSkeleton from "@/components/CarCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicCarsLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto mt-14 px-4 pb-24 pt-8">
        {/* Hero skeleton — matches the real gradient hero */}
        <div className="mb-8 flex flex-col items-center rounded-2xl bg-gradient-to-br from-primary via-primary to-brand-accent px-6 py-8 shadow-lg sm:py-10">
          <Skeleton className="mb-4 h-8 w-64 bg-white/25 sm:h-10 sm:w-96" />
          <Skeleton className="mb-5 h-4 w-48 bg-white/20" />
          <Skeleton className="h-14 w-full max-w-xl rounded-xl bg-white/30" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar skeleton */}
          <div className="hidden w-full space-y-6 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:block lg:w-1/4 lg:self-start">
            {Array.from({ length: 5 }).map((_, s) => (
              <div key={s} className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="w-full space-y-6 lg:w-3/4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-40 rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
