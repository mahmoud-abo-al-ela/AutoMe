import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, MAX_COMPARE_CARS } from "@/lib/utils";
import { specCategories } from "./utils";

const OnMuted = ({ className }: { className?: string }) => <Skeleton className={cn("bg-foreground/10", className)} />;

const Words = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={cn("animate-pulse rounded-md bg-accent box-decoration-clone leading-[inherit] text-transparent", className)}>{children}</span>
);

/** The rows of the first tab, which is the one the comparison opens on. */
const FIRST_TAB = specCategories[0];

const ComparePageSkeleton = () => {
    const t = useTranslations("compare.header");
    return (
        <div>
            {/* As ComparePageHeader, with its own words hidden inside, so lines wrap where the header's do at any width. */}
            <div aria-hidden className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="text-h1 font-extrabold">
                            <Words>{t("title")}</Words>
                        </div>
                        <Skeleton className="h-[25px] w-14 rounded-full" />
                    </div>
                    <p className="text-body">
                        <Words>{t("subtitle", { max: MAX_COMPARE_CARS })}</Words>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="me-2 flex items-center gap-2 text-caption font-medium">
                        <Skeleton className="h-[1.15rem] w-8 rounded-full" />
                        <Words className="max-sm:sr-only">{t("highlightDifferencesLabel")}</Words>
                    </div>
                    <Skeleton className="size-10 shrink-0 rounded-control" />
                    <Skeleton className="size-10 shrink-0 rounded-control" />
                    <Skeleton className="flex h-10 shrink-0 items-center gap-2 rounded-control px-3.5 text-sm font-medium text-transparent">
                        <span className="size-4" />
                        {t("clearAll")}
                    </Skeleton>
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

            {/* As MobileCompareTable: toggle bar, car carousel, then the active car's specs. */}
            <div className="md:hidden">
                <div className="overflow-hidden rounded-lg bg-card">
                    <div className="flex items-center justify-between border-b bg-muted/80 px-4 py-2">
                        <div className="flex items-center gap-2">
                            <OnMuted className="size-3.5" />
                            <OnMuted className="h-4 w-24" />
                            <OnMuted className="h-[1.15rem] w-8 scale-75 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <OnMuted className="h-2 w-4 rounded-full" />
                            <OnMuted className="size-2 rounded-full" />
                        </div>
                    </div>

                    {/* One card at 85% and the edge of the next, as the carousel opens. */}
                    <div className="overflow-hidden">
                        <div className="-ms-2 flex">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={`mobile-card-${i}`} className="min-w-0 shrink-0 grow-0 basis-[85%] ps-2">
                                    <div className="flex gap-3 p-3">
                                        <Skeleton className="aspect-[4/3] w-1/3 rounded-plate" />
                                        <div className="flex w-2/3 flex-col items-start gap-2">
                                            <Skeleton className="h-[21px] w-full" />
                                            <Skeleton className="h-[41px] w-28 rounded-plate" />
                                            <Skeleton className="mt-1 h-10 w-full rounded-control" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t">
                        <div className="border-b bg-muted px-3 py-2">
                            <OnMuted className="h-4 w-24" />
                        </div>
                        <div className="divide-y">
                            {FIRST_TAB.specs.map((spec) => (
                                <div key={`mobile-${spec.key}`} className="flex items-center justify-between px-3 py-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparePageSkeleton;
