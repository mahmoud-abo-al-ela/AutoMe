import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TestDriveSkeleton = () => {
    return (
        <div className="min-h-[400px] md:min-h-[500px]">
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="flex items-start">
                        <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-5 w-36" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TestDriveSkeleton;