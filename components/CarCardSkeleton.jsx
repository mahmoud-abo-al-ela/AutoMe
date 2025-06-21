import { Skeleton } from "./ui/skeleton";

const CarCardSkeleton = () => {
  return (
    <div className="car-card rounded-xl overflow-hidden bg-white shadow-md h-full flex flex-col">
      <div className="relative overflow-hidden">
        <div className="aspect-[16/10] relative overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-3">
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="grid grid-cols-2 gap-y-2 mb-4">
          <div className="flex items-center">
            <Skeleton className="h-3.5 w-3.5 mr-1.5" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-3.5 w-3.5 mr-1.5" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-3.5 w-3.5 mr-1.5" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-3.5 w-3.5 mr-1.5" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="mt-auto">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
};

export default CarCardSkeleton;
