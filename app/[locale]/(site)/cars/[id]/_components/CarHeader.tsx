"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";
import type { CarDetail, PriceFormatter } from "../_lib/car-detail-types";

const CarHeader = ({
    car,
    formatPrice,
}: {
    car: CarDetail;
    formatPrice: PriceFormatter;
}) => {
    const [listedText, setListedText] = useState<string | null>(null);

    useEffect(() => {
        if (!car.createdAt) return;

        const created = new Date(car.createdAt);
        if (isNaN(created.getTime())) return;

        const now = new Date();

        // If the date is in the future (shouldn't happen, but handle gracefully)
        if (created > now) {
            setListedText("Listed recently");
            return;
        }

        // Use calendar day comparison to avoid timezone/hour issues
        const createdDate = new Date(
            created.getFullYear(),
            created.getMonth(),
            created.getDate()
        );
        const todayDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const diffDays = Math.round(
            (todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            setListedText("Listed today");
        } else if (diffDays === 1) {
            setListedText("Listed yesterday");
        } else if (diffDays < 7) {
            setListedText(`Listed ${diffDays} days ago`);
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            setListedText(`Listed ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`);
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            setListedText(
                `Listed ${months} ${months === 1 ? "month" : "months"} ago`
            );
        } else {
            const years = Math.floor(diffDays / 365);
            setListedText(
                `Listed ${years} ${years === 1 ? "year" : "years"} ago`
            );
        }
    }, [car.createdAt]);

    const getStatusBadge = (status: CarDetail["status"]) => {
        switch (status) {
            case "AVAILABLE":
                return (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium">
                        Available
                    </Badge>
                );
            case "SOLD":
                return (
                    <Badge className="bg-red-50 text-red-700 border border-red-200 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium">
                        Sold
                    </Badge>
                );
            // CarStatus has no PENDING member; this case used to read
            // "PENDING", so UNAVAILABLE cars rendered no badge at all.
            case "UNAVAILABLE":
                return (
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium">
                        Unavailable
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <div className="mb-6 sm:mb-8">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {car.featured && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium shadow-sm">
                        <Star className="w-3 h-3 me-1 fill-current" />
                        Featured
                    </Badge>
                )}
                {getStatusBadge(car.status)}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                {car.title || `${car.year} ${car.make} ${car.model}`}
            </h1>

            {/* Price + Listed date */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-2">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(car.price)}
                </div>
            </div>

            {/* Listed date indicator - rendered client-side only to avoid hydration mismatch */}
            {listedText && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{listedText}</span>
                </div>
            )}
        </div>
    );
};

export default CarHeader;
