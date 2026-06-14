import { SkeletonCarGrid } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistLoading() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      
      <SkeletonCarGrid count={6} />
    </div>
  );
}
