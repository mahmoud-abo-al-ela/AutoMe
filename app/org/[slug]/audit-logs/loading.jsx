import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTable } from "@/components/common/Skeletons";

export default function AuditLogsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 sm:h-10 w-48" />
          <Skeleton className="h-4 sm:h-5 w-72" />
        </div>
        <Skeleton className="h-6 w-32 rounded-full hidden sm:block" />
      </div>
      
      <div className="flex flex-wrap gap-4 mb-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      
      <SkeletonTable columns={5} rows={8} />
    </div>
  );
}
