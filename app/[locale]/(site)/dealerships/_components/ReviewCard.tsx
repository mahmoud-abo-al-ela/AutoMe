"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { StarRating } from "@/components/common/StarRating";

import { Star, User } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DealershipReview } from "../_lib/dealership-types";

const ReviewCard = ({ review }: { review: DealershipReview }) => {
    const { rating, title, comment, user, createdAt } = review;

    const t = useTranslations("dealerships.reviews");
    const { date: formatDateFor, number } = useFormatters();
    const formatDate = (date: Date | string) =>
        formatDateFor(date, { month: "long" });

    return (
        <Card className="border border-gray-200">
            <CardContent className="p-6">
                {/* Header: User and Rating */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {user?.imageUrl ? (
                                <Image
                                    src={user.imageUrl}
                                    alt={user.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                />
                            ) : (
                                <User className="h-5 w-5 text-white" />
                            )}
                        </div>

                        {/* User Name and Date */}
                        <div>
                            <h4 className="font-semibold text-base">
                                {user?.name || t("anonymous")}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Rating Badge */}
                    <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800 flex items-center gap-1"
                    >
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-medium">
                            {number(rating, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                            })}
                        </span>
                    </Badge>
                </div>

                {/* Review Title */}
                {title && (
                    <h5 className="font-semibold text-base mb-2">{title}</h5>
                )}

                {/* Review Comment */}
                {comment && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {comment}
                    </p>
                )}

                {/* Star Rating Display */}
                <div className="flex items-center gap-1 mt-3">
                    <StarRating rating={rating} size={16} />
                </div>
            </CardContent>
        </Card>
    );
};

export { ReviewCard };
