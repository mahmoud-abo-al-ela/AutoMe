import { Skeleton } from "@/components/ui/skeleton";
import { specCategories } from "./utils";

/**
 * Content-aware loading skeleton that mimics the actual compare table layout.
 * Shows a header skeleton, 2–3 car card placeholders, and spec row skeletons
 * matching the real category structure.
 */
const ComparePageSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* ── Header skeleton ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-20 rounded-md" />
                </div>
            </div>

            {/* ── Car cards skeleton (desktop) ────────────────────────────────── */}
            <div className="hidden md:block">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Car cards row */}
                    <div className="grid grid-cols-[250px_1fr]">
                        <div className="p-4 bg-gray-50 border-b border-r">
                            <Skeleton className="h-6 w-28" />
                        </div>
                        <div className="grid grid-cols-3 border-b">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={`card-${i}`}
                                    className="p-4 border-r last:border-r-0"
                                >
                                    {/* Image placeholder */}
                                    <Skeleton className="aspect-[4/3] w-full rounded-md mb-3" />
                                    {/* Title */}
                                    <Skeleton className="h-5 w-3/4 mb-2" />
                                    {/* Price + year badges */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-12 rounded-full" />
                                    </div>
                                    {/* Button */}
                                    <Skeleton className="h-8 w-full rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spec rows skeleton */}
                    {specCategories.map((category) => (
                        <div key={category.id}>
                            {/* Category header */}
                            <div className="grid grid-cols-[250px_1fr] bg-gray-100">
                                <div className="p-3 border-b border-r">
                                    <Skeleton className="h-5 w-40" />
                                </div>
                                <div className="grid grid-cols-3 border-b">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div
                                            key={`cat-header-${i}`}
                                            className="p-3 border-r last:border-r-0"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Spec rows */}
                            {category.specs.map((spec) => (
                                <div
                                    key={spec.key}
                                    className="grid grid-cols-[250px_1fr] border-b last:border-b-0"
                                >
                                    <div className="p-3 border-r bg-gray-50">
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <div className="grid grid-cols-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={`${spec.key}-${i}`}
                                                className="p-3 border-r last:border-r-0"
                                            >
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Car cards skeleton (mobile) ─────────────────────────────────── */}
            <div className="md:hidden">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={`mobile-card-${i}`} className="p-4 border-b last:border-b-0">
                            <div className="flex gap-3">
                                {/* Image */}
                                <div className="w-1/3">
                                    <Skeleton className="aspect-[4/3] w-full rounded-md" />
                                </div>
                                {/* Info */}
                                <div className="w-2/3 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-10 rounded-full" />
                                    </div>
                                    <Skeleton className="h-8 w-full rounded-md" />
                                </div>
                            </div>

                            {/* Spec rows preview */}
                            <div className="mt-4 pt-4 border-t space-y-2">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div key={`mobile-spec-${i}-${j}`} className="flex justify-between">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComparePageSkeleton;
