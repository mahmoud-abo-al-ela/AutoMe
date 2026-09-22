import { SkeletonPageHeader, SkeletonStatsGrid, SkeletonChart } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <SkeletonPageHeader className="mb-2" />
          </div>
          <div className="flex gap-2 bg-muted p-1 rounded-md">
            <Skeleton className="h-8 w-24 rounded-sm" />
            <Skeleton className="h-8 w-24 rounded-sm" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 mt-0">
        <SkeletonStatsGrid count={3} />
        <SkeletonChart />
      </div>
    </div>
  );
}
