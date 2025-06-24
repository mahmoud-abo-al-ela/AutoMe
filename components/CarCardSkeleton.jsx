import { Skeleton } from "./ui/skeleton";

const CarCardSkeleton = () => {
  return (
    <div className="car-card rounded-xl overflow-hidden bg-white shadow-md h-full flex flex-col">
      <div className="relative overflow-hidden">
        <div className="aspect-[16/10] relative overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" />
        </div>
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
        </div>
      </div>

      <div className="p-2 sm:p-3 flex flex-col flex-grow">
        <div className="mb-1.5 sm:mb-2">
          <Skeleton className="h-4 sm:h-5 w-3/4 mb-1" />
          <Skeleton className="h-3 sm:h-3.5 w-1/2" />
        </div>

        <div className="grid grid-cols-2 gap-x-1 gap-y-1 sm:gap-y-1.5 mb-2 sm:mb-3">
          <div className="flex items-center">
            <Skeleton className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            <Skeleton className="h-3 sm:h-3.5 w-8 sm:w-10" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            <Skeleton className="h-3 sm:h-3.5 w-12 sm:w-14" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            <Skeleton className="h-3 sm:h-3.5 w-10 sm:w-12" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            <Skeleton className="h-3 sm:h-3.5 w-14 sm:w-16" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
          <Skeleton className="h-4 sm:h-5 w-12 sm:w-14" />
          <Skeleton className="h-4 sm:h-5 w-14 sm:w-16" />
          <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
        </div>

        <div className="mt-auto">
          <Skeleton className="h-7 sm:h-8 w-full" />
        </div>
      </div>
    </div>
  );
};

export default CarCardSkeleton;
