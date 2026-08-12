import { Skeleton } from "./ui/skeleton";

const CarCardSkeleton = () => {
  return (
    <div className="car-card rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="relative overflow-hidden">
        <div className="aspect-[16/9] relative overflow-hidden">
          <div className="w-full h-full skeleton-shimmer" />
        </div>
        <div className="absolute top-2 right-2">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full skeleton-shimmer" />
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <div className="h-6 sm:h-7 w-20 sm:w-24 rounded-lg skeleton-shimmer" />
        </div>
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-grow bg-white">
        <div className="mb-2 sm:mb-2.5">
          <div className="h-4 sm:h-5 w-3/4 mb-1 rounded skeleton-shimmer" />
          <div className="h-3 sm:h-3.5 w-1/2 rounded skeleton-shimmer" />
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-y-2.5 mb-3 sm:mb-4">
          <div className="flex items-center">
            <div className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 rounded-full skeleton-shimmer" />
            <div className="h-3 sm:h-3.5 w-10 sm:w-12 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center">
            <div className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 rounded-full skeleton-shimmer" />
            <div className="h-3 sm:h-3.5 w-12 sm:w-14 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center">
            <div className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 rounded-full skeleton-shimmer" />
            <div className="h-3 sm:h-3.5 w-10 sm:w-12 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center">
            <div className="h-5 w-5 sm:h-6 sm:w-6 mr-1.5 rounded-full skeleton-shimmer" />
            <div className="h-3 sm:h-3.5 w-14 sm:w-16 rounded skeleton-shimmer" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
          <div className="h-5 sm:h-6 w-14 sm:w-16 rounded-full skeleton-shimmer" />
          <div className="h-5 sm:h-6 w-16 sm:w-18 rounded-full skeleton-shimmer" />
          <div className="h-5 sm:h-6 w-14 sm:w-20 rounded-full skeleton-shimmer" />
        </div>

        <div className="h-px bg-slate-100 w-full mb-3"></div>

        <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 skeleton-shimmer" />
          <div className="h-3 sm:h-3.5 w-20 sm:w-24 rounded skeleton-shimmer" />
        </div>

        <div className="mt-auto">
          <div className="h-8 sm:h-9 w-full rounded-lg skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default CarCardSkeleton;
