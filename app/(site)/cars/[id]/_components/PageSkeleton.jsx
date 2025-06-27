import React from "react";

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="animate-pulse space-y-4 sm:space-y-6 lg:space-y-8 w-full">
          <div className="h-8 bg-gray-200 rounded w-1/4 hidden md:block"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="h-64 sm:h-80 md:h-96 bg-gray-200 rounded-lg"></div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 sm:h-16 md:h-20 w-16 sm:w-20 md:w-24 flex-shrink-0 bg-gray-200 rounded-md snap-start"
                  ></div>
                ))}
              </div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-32 sm:h-40 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="hidden md:block h-64 sm:h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-48 sm:h-56 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PageSkeleton;
