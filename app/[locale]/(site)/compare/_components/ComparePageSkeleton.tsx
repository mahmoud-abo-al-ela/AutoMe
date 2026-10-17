import { Skeleton } from "@/components/ui/skeleton";
import { cn, MAX_COMPARE_CARS } from "@/lib/utils";
import { specCategories } from "./utils";

const OnMuted = ({ className }: { className?: string }) => <Skeleton className={cn("bg-foreground/10", className)} />;

/** The rows of the first tab, which is the one the comparison opens on. */
const FIRST_TAB = specCategories[0];

const ComparePageSkeleton = () => {
    return (
        <div>
            {/* ── Header, as ComparePageHeader; bar heights are its line heights ────────────────────────────────── */}
            <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-[46px] w-72 max-w-[60vw]" />
                        <Skeleton className="h-[25px] w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-[26px] w-[34rem] max-w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="me-2 h-5 w-44 max-sm:w-10" />
                    <Skeleton className="size-10 rounded-control" />
                    <Skeleton className="size-10 rounded-control" />
                    <Skeleton className="h-10 w-28 rounded-control" />
                </div>
            </div>

            {/* ── Table, as CompareTable (desktop) ────────────────────────────── */}
            <div className="hidden md:block">
                <div className="overflow-hidden rounded-lg bg-card">
                    {/* The car columns: always three, cars then "Add a car" slots. */}
                    <div className="grid grid-cols-3 gap-4 border-b p-4">
                        {Array.from({ length: MAX_COMPARE_CARS }).map((_, i) => (
                            <div key={`card-${i}`} className="flex flex-col overflow-hidden rounded-control border border-border bg-card">
                                <Skeleton className="aspect-[3/2] w-full rounded-none" />
                                <div className="flex flex-col gap-3 p-4">
                                    <Skeleton className="h-[26px] w-3/4" />
                                    <Skeleton className="h-[41px] w-36" />
                                    <Skeleton className="h-[19px] w-1/2" />
                                    <Skeleton className="h-10 w-full rounded-control" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tab strip */}
                    <div className="flex gap-1 border-b bg-muted/80 px-4 pt-3">
                        <div className="flex h-10 w-44 items-center rounded-t-md bg-card px-4">
                            <Skeleton className="h-4 w-full" />
                        </div>
                        <div className="flex h-10 w-64 items-center px-4">
                            <OnMuted className="h-4 w-full" />
                        </div>
                        <div className="flex h-10 w-28 items-center px-4">
                            <OnMuted className="h-4 w-full" />
                        </div>
                    </div>

                    {/* The first tab's section header and rows */}
                    <div className="border-b border-border bg-muted px-4 py-2.5">
                        <OnMuted className="h-4 w-36" />
                    </div>
                    {FIRST_TAB.specs.map((spec, index) => (
                        <div key={spec.key} className="grid grid-cols-[250px_1fr] border-b last:border-b-0">
                            <div className={cn("flex items-center border-e p-3", index % 2 === 0 ? "bg-muted/80" : "bg-muted")}>
                                <OnMuted className="h-4 w-20" />
                            </div>
                            <div className="grid grid-cols-3">
                                {Array.from({ length: MAX_COMPARE_CARS }).map((_, i) => (
                                    <div key={`${spec.key}-${i}`} className="border-e p-3 last:border-e-0">
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Car cards skeleton (mobile) ─────────────────────────────────── */}
            <div className="md:hidden">
                <div className="bg-card rounded-lg overflow-hidden">
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
