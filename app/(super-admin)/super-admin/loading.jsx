import { SkeletonPageHeader, SkeletonStatsGrid, SkeletonTable } from "@/components/common/Skeletons";

export default function SuperAdminLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      
      <SkeletonStatsGrid count={4} className="md:grid-cols-2 lg:grid-cols-4" />
      
      <div className="mt-4">
        <div className="mb-4">
          <SkeletonPageHeader /> {/* Sub-header for table, no margin */}
        </div>
        <SkeletonTable columns={5} rows={6} />
      </div>
    </div>
  );
}
