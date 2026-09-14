"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDealershipReview } from "@/actions/dealerships";
import { toast } from "sonner";

const ReviewForm = ({
    organizationId,
    onSuccess,
}: {
    organizationId: string;
    onSuccess: () => void;
}) => {
    const t = useTranslations("dealerships.reviews.form");
    const fmt = useFormatters();
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const renderStar = (value: number) => {
        return (
            <button
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={t("ratingLabel", {
                    count: value,
                    value: fmt.number(value),
                })}
                className="transition-transform hover:scale-110"
            >
                <Star
                    className={`h-6 w-6 ${value <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                />
            </button>
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error(t("needRating"));
            return;
        }

        if (!title.trim() && !comment.trim()) {
            toast.error(t("needText"));
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await createDealershipReview(organizationId, {
                rating,
                title: title.trim() || null,
                comment: comment.trim() || null,
            });

            if (response.success) {
                toast.success(t("success"));
                // Reset form
                setRating(0);
                setHoveredRating(0);
                setTitle("");
                setComment("");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(response.error?.message || t("failed"));
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error(t("failedRetry"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium">
                            {t("overallRating")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => renderStar(value))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="review-title" className="text-base font-medium">
                            {t("reviewTitle")}
                        </Label>
                        <input
                            id="review-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("titlePlaceholder")}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={100}
                        />
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="review-comment" className="text-base font-medium">
                            {t("yourReview")}
                        </Label>
                        <Textarea
                            id="review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("commentPlaceholder")}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-end">
                            {t("counter", {
                                count: fmt.number(comment.length),
                                max: fmt.number(500),
                            })}
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full gap-2"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                </form>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground mt-4">
                    {t("moderation")}
                </p>
            </CardContent>
        </Card>
    );
};

export default ReviewForm;
