import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DealershipsLoading() {
  return (
    <div className="container mx-auto py-4 px-4 mt-18">
      {/* Hero Banner with integrated search */}
      <div className="w-full bg-muted/30 py-16 sm:py-20 border rounded-lg mb-8">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-10 sm:h-14 w-64 sm:w-[400px] mb-4" />
          <Skeleton className="h-5 sm:h-6 w-80 sm:w-[600px] mb-8" />
          <Skeleton className="h-14 w-full max-w-2xl rounded-full" />
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <Skeleton className="h-12 w-32 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-24 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
      
      {/* Dealership Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-[16/9] w-full relative">
              <Skeleton className="absolute inset-0 rounded-none" />
            </div>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="pt-4 border-t flex justify-between">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
