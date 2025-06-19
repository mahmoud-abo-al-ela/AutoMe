import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const WorkingHoursSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 sm:h-8 w-1/3 mb-2" />
        <Skeleton className="h-3 sm:h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <Skeleton className="h-5 sm:h-6 w-8 sm:w-10" />
              <Skeleton className="h-4 sm:h-5 w-20 sm:w-24" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-8 sm:h-10 w-full sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-4" />
              <Skeleton className="h-8 sm:h-10 w-full sm:w-32" />
            </div>
          </div>
        ))}
        <div className="pt-4 border-t">
          <Skeleton className="h-9 sm:h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkingHoursSkeleton;
