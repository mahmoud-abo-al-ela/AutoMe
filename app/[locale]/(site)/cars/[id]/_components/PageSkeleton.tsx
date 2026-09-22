import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-1.5 mb-6">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-12 rounded hidden sm:block" />
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Image gallery skeleton */}
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <div className="flex gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-12 sm:h-16 md:h-18 w-16 sm:w-20 md:w-24 flex-shrink-0 rounded-lg"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Mobile: CarInfoCard skeleton */}
            <div className="block lg:hidden space-y-4">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4">
                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
                {/* Badges */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                {/* Title */}
                <Skeleton className="h-7 w-3/4 rounded" />
                {/* Price */}
                <Skeleton className="h-9 w-1/3 rounded" />
                {/* Listed date */}
                <Skeleton className="h-4 w-28 rounded" />
                {/* Dealership section */}
                <Skeleton className="h-px w-full" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </div>
                {/* CTA buttons */}
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-4 sm:space-y-6">
              {/* Tab triggers */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
              {/* Tab content */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-6 w-40 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>
          </div>

          {/* Sidebar skeleton - desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-4">
                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
                {/* Badges */}
                <div className="flex gap-2">
                  <Skeleton
                    className="h-6 w-20 rounded-full"
                    style={{ animationDelay: "150ms" }}
                  />
                  <Skeleton
                    className="h-6 w-16 rounded-full"
                    style={{ animationDelay: "200ms" }}
                  />
                </div>
                {/* Title */}
                <Skeleton
                  className="h-7 w-3/4 rounded"
                  style={{ animationDelay: "250ms" }}
                />
                <Skeleton
                  className="h-5 w-1/2 rounded"
                  style={{ animationDelay: "300ms" }}
                />
                {/* Price */}
                <Skeleton
                  className="h-9 w-1/3 rounded"
                  style={{ animationDelay: "350ms" }}
                />
                {/* Listed date */}
                <Skeleton
                  className="h-4 w-28 rounded"
                  style={{ animationDelay: "400ms" }}
                />
                {/* Dealership section */}
                <Skeleton className="h-px w-full" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </div>
                {/* Separator + CTA buttons */}
                <Skeleton className="h-px w-full" />
                <Skeleton
                  className="h-10 w-full rounded-lg"
                  style={{ animationDelay: "450ms" }}
                />
                <Skeleton
                  className="h-10 w-full rounded-lg"
                  style={{ animationDelay: "500ms" }}
                />
                <div className="flex gap-2">
                  <Skeleton
                    className="h-10 flex-1 rounded-lg"
                    style={{ animationDelay: "550ms" }}
                  />
                  <Skeleton
                    className="h-10 flex-1 rounded-lg"
                    style={{ animationDelay: "600ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
