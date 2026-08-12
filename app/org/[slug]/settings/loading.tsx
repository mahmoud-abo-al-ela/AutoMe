import { SkeletonPageHeader, SkeletonSettingsCard } from "@/components/common/Skeletons";

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    </div>
  );
}
