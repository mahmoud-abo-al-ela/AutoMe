import { Skeleton } from "@/components/ui/skeleton";

export function DealershipCardSkeleton() {
    return (
        <div className="flex h-full flex-col items-center rounded-control border border-border bg-card p-5 text-center sm:p-6">
            {/* Logo */}
            <Skeleton className="mb-4 h-20 w-20 rounded-control" />
            {/* Name */}
            <Skeleton className="h-5 w-2/3" />
            {/* Rating */}
            <Skeleton className="mt-3 h-4 w-24" />
            {/* Location */}
            <Skeleton className="mt-3 h-3 w-28" />
            {/* Brand pills */}
            <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            {/* Footer */}
            <div className="mt-auto w-full border-t border-border pt-4">
                <Skeleton className="mx-auto h-4 w-32" />
            </div>
        </div>
    );
}

export function DealershipGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <DealershipCardSkeleton key={index} />
            ))}
        </div>
    );
}

/**
 * The dealership page while the server renders it: the identity row, the
 * visit card beside the tabs (above them on phones), and a grid of cars —
 * the same shapes the page lands in.
 */
export function DealershipDetailSkeleton() {
    return (
        <div aria-hidden className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-4 sm:px-6 md:pt-6 xl:px-0">
            <Skeleton className="mb-5 hidden h-4 w-56 md:block" />
            <div className="flex items-center gap-4 sm:gap-6">
                <Skeleton className="size-16 shrink-0 rounded-[16px] sm:size-24 sm:rounded-[20px]" />
                <div className="flex flex-1 flex-col gap-2.5">
                    <Skeleton className="h-9 w-2/3 max-w-md" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                </div>
            </div>
            <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
            <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
                <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:p-6 lg:col-start-2 lg:row-start-1">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-12 w-full rounded-control" />
                    <div className="grid grid-cols-2 gap-2.5">
                        <Skeleton className="h-12 rounded-control" />
                        <Skeleton className="h-12 rounded-control" />
                    </div>
                </div>
                <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                    <div className="mb-6 flex gap-6 border-b border-border pb-3">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="mb-5 h-12 w-full rounded-control" />
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="overflow-hidden rounded-[16px] border border-border bg-card">
                                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                                <div className="flex flex-col gap-2 p-4">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
