"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
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
            toast.error("Please select a rating");
            return;
        }

        if (!title.trim() && !comment.trim()) {
            toast.error("Please provide a title or comment");
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
                toast.success(response.message || "Review submitted successfully!");
                // Reset form
                setRating(0);
                setHoveredRating(0);
                setTitle("");
                setComment("");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(response.error?.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium">
                            Overall Rating <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => renderStar(value))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="review-title" className="text-base font-medium">
                            Review Title
                        </Label>
                        <input
                            id="review-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={100}
                        />
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="review-comment" className="text-base font-medium">
                            Your Review
                        </Label>
                        <Textarea
                            id="review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about your experience with this dealership..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-end">
                            {comment.length}/500
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full gap-2"
                    >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </form>

                {/* Info Text */}
                <p className="text-xs text-muted-foreground mt-4">
                    Your review will be visible after approval by our moderation team.
                </p>
            </CardContent>
        </Card>
    );
};

export default ReviewForm;
