import { SkeletonPageHeader, SkeletonFilterBar, SkeletonTable } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function TestDrivesLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      
      <div className="flex flex-col gap-4 mb-4">
        <SkeletonFilterBar />
        <div className="flex overflow-x-auto gap-2 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 flex-shrink-0 rounded-md" />
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-12 rounded-full" />
            ))}
          </div>
        </CardHeader>
        <div className="hidden md:block border-t">
          <SkeletonTable columns={5} rows={5} bare />
        </div>
        
        <div className="md:hidden space-y-4 p-4 border-t">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/30 border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
