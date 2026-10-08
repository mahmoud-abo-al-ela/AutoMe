"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { useFormatters } from "@/hooks/use-formatters";
import { Button } from "@/components/ui/button";
import { SiteEmptyState } from "@/components/brand";
import { StarRating } from "@/components/common/StarRating";
import { Pagination } from "@/components/common/Pagination";
import { getDealershipReviews } from "@/actions/dealerships";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import { BuyerAccessNotice, useBuyerAccess } from "@/components/BuyerAccess";
import { ReviewCard } from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import type { DealershipReview, ReviewsPagination, ReviewRatingCount } from "../_lib/dealership-types";

const PER_PAGE = 10;

/**
 * The Reviews tab: the average and how the ratings break down (counted over
 * every review, not just this page), the invitation to write one, then the
 * reviews. The average and total come from the page's server render; after
 * a review is posted the page refreshes, so the header's rating follows.
 */
const DealershipReviews = ({
    organizationId,
    organizationSlug,
    averageRating,
    totalReviews,
}: {
    organizationId: string;
    organizationSlug?: string;
    averageRating: number;
    totalReviews: number;
}) => {
    const t = useTranslations("dealerships.reviews");
    const tDetail = useTranslations("dealerships.detail");
    const fmt = useFormatters();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { signInTo } = useAuthRedirects();
    // Reviews come from buyers: not platform staff, and no dealership's team.
    const buyerTarget = { organizationId, organizationSlug };
    const access = useBuyerAccess(buyerTarget);
    const canReview = access.can("review");
    // The visit card beside this tab already explains staff, a dealer's own
    // page and impersonation; only "dealers do not review" is news here.
    const explainHere = access.blocked("review") === "dealerReview";

    const [reviews, setReviews] = useState<DealershipReview[]>([]);
    const [ratingCounts, setRatingCounts] = useState<ReviewRatingCount[]>([]);
    const [pagination, setPagination] = useState<ReviewsPagination>({ page: 1, limit: PER_PAGE, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(
        async (page: number) => {
            setLoading(true);
            try {
                const response = await getDealershipReviews(organizationId, { page, limit: PER_PAGE });
                if (response.success) {
                    setReviews(response.data.reviews);
                    setRatingCounts(response.data.ratingCounts);
                    setPagination(response.data.pagination);
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        },
        [organizationId]
    );

    useEffect(() => {
        load(1);
    }, [load]);

    // Signed out: sign in, then back to this tab.
    const startReview = () => (user ? setShowForm(true) : router.push(signInTo(`${pathname}?tab=reviews`)));

    const handleReviewSubmit = () => {
        setShowForm(false);
        load(1);
        router.refresh();
    };

    const average = fmt.number(averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return (
        <div className="flex flex-col gap-6">
            {explainHere && <BuyerAccessNotice action="review" target={buyerTarget} />}

            {totalReviews > 0 && (
                <section className="grid items-center gap-6 rounded-[20px] border border-border bg-card p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_14rem]">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[3.5rem] font-black leading-none">{average}</p>
                        <StarRating rating={averageRating} size={18} />
                        <p className="text-caption text-muted-foreground">
                            <span className="sr-only">{tDetail("reviews.outOfFive", { value: average })} · </span>
                            {tDetail("reviewCount", { count: totalReviews, value: fmt.number(totalReviews) })}
                        </p>
                    </div>

                    <ul aria-label={t("distribution")} className="flex flex-col gap-2">
                        {ratingCounts.map(({ rating, count }) => (
                            <li key={rating} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-caption">
                                <span>{fmt.number(rating)} ★</span>
                                <span aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                                    <span
                                        className="block h-full rounded-full bg-foreground"
                                        style={{ width: `${totalReviews ? (count / totalReviews) * 100 : 0}%` }}
                                    />
                                </span>
                                <span className="text-end text-muted-foreground">{fmt.number(count)}</span>
                            </li>
                        ))}
                    </ul>

                    {canReview && (
                        <div className="flex flex-col items-start gap-2 md:col-span-2 xl:col-span-1">
                            <p className="font-semibold">{tDetail("reviews.boughtHere")}</p>
                            <p className="text-caption text-muted-foreground">{tDetail("reviews.tellOthers")}</p>
                            <Button variant="outline-strong" size="xl" className="mt-1 w-full" onClick={startReview}>
                                {showForm ? t("cancel") : t("writeReview")}
                            </Button>
                        </div>
                    )}
                </section>
            )}

            {showForm && <ReviewForm organizationId={organizationId} onSuccess={handleReviewSubmit} />}

            {loading ? (
                <div className="flex flex-col gap-3" aria-hidden>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-[20px] bg-muted" />
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                !showForm && (
                    <SiteEmptyState
                        icon={MessageSquare}
                        title={t("emptyTitle")}
                        description={canReview ? t("emptyBody") : undefined}
                        primary={canReview ? { label: t("writeReview"), onClick: startReview } : undefined}
                    />
                )
            ) : (
                <section className="flex flex-col gap-3">
                    <h2 className="text-h3 font-semibold">{tDetail("reviews.whatBuyersSay")}</h2>
                    <ul className="flex flex-col gap-3">
                        {reviews.map((review) => (
                            <li key={review.id}>
                                <ReviewCard review={review} />
                            </li>
                        ))}
                    </ul>
                    {pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={load}
                            disabled={loading}
                        />
                    )}
                </section>
            )}
        </div>
    );
};

export default DealershipReviews;
