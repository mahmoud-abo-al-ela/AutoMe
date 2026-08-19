"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewCard } from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { getDealershipReviews, createDealershipReview } from "@/actions/dealerships";
import { Pagination } from "@/components/common/Pagination";
import { useUser } from "@clerk/nextjs";
import { EmptyState } from "@/components/common/EmptyState";
import type {
    DealershipReview,
    ReviewsPagination,
} from "../_lib/dealership-types";

const DealershipReviews = ({ organizationId }: { organizationId: string }) => {
    const { user, isLoaded } = useUser();
    const [reviews, setReviews] = useState<DealershipReview[]>([]);
    const [pagination, setPagination] = useState<ReviewsPagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const response = await getDealershipReviews(organizationId, {
                    page: pagination.page,
                    limit: pagination.limit,
                });
                if (response.success) {
                    setReviews(response.data.reviews);
                    setPagination(response.data.pagination);
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
        // `pagination.limit` is read but deliberately not a dependency: the
        // effect replaces the whole pagination object from the response, so
        // depending on it would refetch whenever the server echoed a limit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, pagination.page]);

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 400, behavior: "smooth" });
    };

    const handleReviewSubmit = () => {
        setShowForm(false);
        // Refresh reviews list
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const response = await getDealershipReviews(organizationId, {
                    page: 1,
                    limit: pagination.limit,
                });
                if (response.success) {
                    setReviews(response.data.reviews);
                    setPagination(response.data.pagination);
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    };

    const calculateRatingDistribution = () => {
        const distribution: Record<number, number> = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        };
        reviews.forEach((review) => {
            const rating = Math.round(review.rating);
            if (rating >= 1 && rating <= 5) {
                distribution[rating]++;
            }
        });
        return distribution;
    };

    const ratingDistribution = calculateRatingDistribution();
    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
            : "0.0";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Reviews ({totalReviews})
                </h2>
                {user && (
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? "outline" : "default"}
                        className="gap-2"
                    >
                        <PenTool className="h-4 w-4" />
                        {showForm ? "Cancel" : "Write a Review"}
                    </Button>
                )}
            </div>

            {/* Rating Summary */}
            {totalReviews > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Average Rating */}
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Average Rating
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                                    <span className="text-4xl font-bold">
                                        {averageRating}
                                    </span>
                                </div>
                            </div>

                            {/* Rating Distribution */}
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Rating Distribution
                                </p>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <div key={rating} className="flex items-center gap-3">
                                            <span className="text-sm w-8 text-end">
                                                {rating}★
                                            </span>
                                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400 transition-all duration-500"
                                                    style={{
                                                        width: `${(ratingDistribution[rating] / totalReviews) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm w-12 text-start">
                                                {ratingDistribution[rating]} ({Math.round(
                                                    (ratingDistribution[rating] / totalReviews) * 100
                                                )}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Review Form */}
            {showForm && (
                <ReviewForm
                    organizationId={organizationId}
                    onSuccess={handleReviewSubmit}
                />
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-32 bg-gray-100 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title="No reviews yet"
                    description="Be the first to review this dealership!"
                    actionLabel="Write a Review"
                    onAction={() => setShowForm(true)}
                />
            ) : (
                <>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                                disabled={loading}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DealershipReviews;
