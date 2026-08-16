"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, Share2, Scale } from "lucide-react";

const CarActionButtons = ({
    isFavorite,
    isInCompare,
    isLoading,
    onToggleFavorite,
    onToggleCompare,
    onShare,
}: {
    isFavorite: boolean;
    isInCompare: boolean;
    isLoading: boolean;
    onToggleFavorite: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onToggleCompare: () => void;
    onShare: () => void;
}) => {
    return (
        <div className="flex gap-1.5 sm:gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFavorite}
                        disabled={isLoading}
                        className={`min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] gap-1.5 transition-all duration-200 cursor-pointer ${isFavorite
                                ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                                : "hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                            }`}
                    >
                        <Heart
                            className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                        />
                        <span className="hidden xl:inline text-xs">
                            {isFavorite ? "Saved" : "Save"}
                        </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isFavorite ? "Remove from wishlist" : "Add to wishlist"}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleCompare}
                        className={`min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] gap-1.5 transition-all duration-200 cursor-pointer ${isInCompare
                                ? "text-blue-500 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                                : "hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50"
                            }`}
                    >
                        <Scale
                            className={`w-4 h-4 ${isInCompare ? "fill-current" : ""}`}
                        />
                        <span className="hidden xl:inline text-xs">Compare</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isInCompare ? "Remove from comparison" : "Add to comparison"}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShare}
                        className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] gap-1.5 transition-all duration-200 hover:text-purple-500 hover:border-purple-200 hover:bg-purple-50 cursor-pointer"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden xl:inline text-xs">Share</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Share this car</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default CarActionButtons;
