import { SkeletonCarGrid } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicCarsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
      <div className="container mx-auto py-4 px-4 pt-8 mt-14">
        {/* Hero Section Skeleton */}
        <div className="w-full bg-white rounded-2xl shadow-sm border p-8 mb-8 flex flex-col items-center">
          <Skeleton className="h-10 sm:h-12 w-64 sm:w-96 mb-6" />
          <Skeleton className="h-14 w-full max-w-2xl rounded-full" />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Skeleton (Hidden on Mobile) */}
          <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start space-y-8 bg-white p-6 rounded-xl border">
            {Array.from({ length: 5 }).map((_, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-sm" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Main Content Area */}
          <div className="w-full lg:w-3/4 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>
            
            <SkeletonCarGrid count={6} columns="lg:grid-cols-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
