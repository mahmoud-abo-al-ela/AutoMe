"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";

const CarHeader = ({ car, formatPrice }) => {
    const [listedText, setListedText] = useState(null);

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

    const getStatusBadge = (status) => {
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
            case "PENDING":
                return (
                    <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium">
                        Pending
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
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                    </Badge>
                )}
                {getStatusBadge(car.status)}
                {car.condition && (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-medium">
                        {car.condition}
                    </Badge>
                )}
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
                {car.oldPrice && (
                    <div className="text-xs sm:text-sm text-gray-400 line-through">
                        {formatPrice(car.oldPrice)}
                    </div>
                )}
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
