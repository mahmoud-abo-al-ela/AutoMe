import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingGrid } from "@/components/common/LoadingStates";

export const SkeletonPageHeader = ({ className }) => (
  <div className={`flex flex-col gap-2 ${className || ""}`}>
    <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
    <Skeleton className="h-4 sm:h-5 w-72 sm:w-96" />
  </div>
);

export const SkeletonStatsGrid = ({ count = 3, className = "md:grid-cols-3" }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 ${className} gap-4 sm:gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
    </CardContent>
  </Card>
);

export const SkeletonTableRow = ({ columns = 5 }) => (
  <div className="flex items-center space-x-4 py-4 px-6 border-b border-border last:border-0">
    {Array.from({ length: columns }).map((_, i) => (
      <div key={i} className={`flex-1 ${i === 0 ? "max-w-[50px]" : ""}`}>
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 5, bare = false }) => {
  const content = (
    <>
      <div className="bg-muted/50 py-3 px-6 border-b border-border flex items-center space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`flex-1 ${i === 0 ? "max-w-[50px]" : ""}`}>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </div>
    </>
  );

  if (bare) {
    return <div className="overflow-hidden">{content}</div>;
  }

  return <Card className="overflow-hidden">{content}</Card>;
};

export const SkeletonFormField = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export const SkeletonForm = ({ fields = 4 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <SkeletonFormField key={i} />
    ))}
    <Skeleton className="h-10 w-32 mt-8" />
  </div>
);

export const SkeletonFilterBar = () => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <Skeleton className="h-10 flex-1 sm:max-w-md" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

export const SkeletonChatLayout = () => (
  <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] border rounded-lg shadow-sm bg-background overflow-hidden">
    <div className="border-r border-border hidden md:flex flex-col">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex-1 overflow-auto p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-md mb-1">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-col">
      <div className="h-16 border-b border-border p-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex-1 p-4 space-y-6 overflow-hidden">
        <div className="flex justify-end">
          <Skeleton className="h-16 w-[70%] rounded-2xl rounded-tr-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-12 w-[60%] rounded-2xl rounded-tl-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-[80%] rounded-2xl rounded-tl-sm" />
        </div>
      </div>
      <div className="p-4 border-t border-border mt-auto">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  </div>
);

export const SkeletonSettingsCard = () => (
  <Card>
    <CardHeader className="pb-3 sm:pb-4">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-2 sm:mb-3" />
      <Skeleton className="h-6 sm:h-7 w-40 mb-1" />
      <Skeleton className="h-4 w-[90%]" />
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-9 sm:h-10 w-full rounded-md" />
    </CardContent>
  </Card>
);

export const SkeletonCarGrid = LoadingGrid;
