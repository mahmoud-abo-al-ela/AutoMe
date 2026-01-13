"use client";

import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const CarHeader = ({ car, formatPrice }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case "AVAILABLE":
                return (
                    <Badge className="bg-green-100 text-green-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        Available
                    </Badge>
                );
            case "SOLD":
                return (
                    <Badge className="bg-red-100 text-red-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        Sold
                    </Badge>
                );
            case "PENDING":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        Pending
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                {car.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                    </Badge>
                )}
                {getStatusBadge(car.status)}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                {car.title || `${car.year} ${car.make} ${car.model}`}
            </h1>

            <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(car.price)}
                </div>
                {car.oldPrice && (
                    <div className="text-xs sm:text-sm text-gray-500 line-through">
                        {formatPrice(car.oldPrice)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarHeader;