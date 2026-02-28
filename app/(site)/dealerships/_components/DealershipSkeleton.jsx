import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DealershipCardSkeleton() {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-3">
                <div className="flex items-start gap-4">
                    {/* Logo skeleton */}
                    <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />

                    <div className="flex-1 space-y-2">
                        {/* Name skeleton */}
                        <Skeleton className="h-6 w-3/4" />

                        {/* Rating skeleton */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>

                {/* Plan badge skeleton */}
                <Skeleton className="h-5 w-20" />
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Description skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Contact info skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Car count skeleton */}
                <Skeleton className="h-4 w-32" />
            </CardContent>
        </Card>
    );
}

export function DealershipGridSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <DealershipCardSkeleton key={index} />
            ))}
        </div>
    );
}

export function DealershipDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-4 mt-18 space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-3" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-3" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Hero Header skeleton */}
            <div className="rounded-2xl border border-slate-100 p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                    {/* Logo */}
                    <Skeleton className="h-28 w-28 sm:h-36 sm:w-36 lg:h-40 lg:w-40 rounded-2xl flex-shrink-0" />

                    <div className="flex-1 space-y-4">
                        {/* Name + verified badge */}
                        <Skeleton className="h-9 w-64" />

                        {/* Rating + open status */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-28 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats bar skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                        <CardContent className="p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-11 w-11 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-6">
                {/* Tab triggers */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 w-fit">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>

                {/* Tab content - car grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-9 w-72 rounded-md" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="pt-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
