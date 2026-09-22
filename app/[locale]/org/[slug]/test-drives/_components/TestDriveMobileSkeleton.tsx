import { Card, CardContent } from "@/components/ui/card";

export const TestDriveMobileSkeleton = () => {
    return (
        <div className="md:hidden space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                        {/* Car Information Skeleton */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="h-20 w-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-24" />
                                <div className="h-5 bg-gray-200 rounded animate-pulse w-20" />
                            </div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        </div>

                        {/* Customer Information Skeleton */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-2/3" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                            </div>
                        </div>

                        {/* Date & Time Information Skeleton */}
                        <div className="flex items-center justify-between">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};