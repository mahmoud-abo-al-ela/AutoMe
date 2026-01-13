"use client";

import { Button } from "@/components/ui/button";
import { Heart, Share2, Scale } from "lucide-react";

const CarActionButtons = ({
    isFavorite,
    isInCompare,
    isLoading,
    onToggleFavorite,
    onToggleCompare,
    onShare,
}) => {
    return (
        <div className="flex gap-1 sm:gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onToggleFavorite}
                disabled={isLoading}
                className={`hover:scale-110 transition-transform cursor-pointer ${isFavorite
                        ? "text-red-500 border-red-200 bg-red-50"
                        : "hover:text-red-500"
                    }`}
            >
                <Heart
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${isFavorite ? "fill-current" : ""
                        }`}
                />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onToggleCompare}
                className={`hover:scale-110 transition-transform cursor-pointer ${isInCompare
                        ? "text-blue-500 border-blue-200 bg-blue-50"
                        : "hover:text-blue-500"
                    }`}
            >
                <Scale
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${isInCompare ? "fill-current" : ""
                        }`}
                />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:scale-110 transition-transform cursor-pointer"
            >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
        </div>
    );
};

export default CarActionButtons;