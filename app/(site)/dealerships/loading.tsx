import { Skeleton } from "@/components/ui/skeleton";
import { DealershipGridSkeleton } from "./_components/DealershipSkeleton";

export default function DealershipsLoading() {
    return (
        <div className="container mx-auto py-4 px-4 mt-18">
            {/* Hero */}
            <div className="mb-8 rounded-2xl bg-muted/40 px-6 py-10 sm:px-10 sm:py-12">
                <div className="mx-auto flex max-w-2xl flex-col items-center">
                    <Skeleton className="h-8 w-56 sm:h-10 sm:w-72" />
                    <Skeleton className="mt-3 h-4 w-48" />
                    <Skeleton className="mt-6 h-14 w-full max-w-xl rounded-xl" />
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-5 w-40" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-9 w-20 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="hidden h-9 w-[110px] rounded-md sm:block" />
                    <Skeleton className="h-9 w-[180px] rounded-md" />
                </div>
            </div>

            {/* Grid */}
            <DealershipGridSkeleton count={8} />
        </div>
    );
}
