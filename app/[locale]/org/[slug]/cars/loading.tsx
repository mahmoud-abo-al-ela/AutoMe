import { SkeletonPageHeader, SkeletonFilterBar, SkeletonTable } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      
      <SkeletonFilterBar />
      
      <div className="flex flex-wrap gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24 rounded-full" />
        ))}
      </div>
      
      <div className="hidden md:block">
        <SkeletonTable columns={6} rows={5} />
      </div>
      
      <div className="md:hidden space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-24 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
