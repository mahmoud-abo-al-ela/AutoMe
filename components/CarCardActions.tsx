"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toggleWishlist } from "@/actions/cars-listing";
import { queryKeys } from "@/lib/query-client";
import { compareUtils } from "@/lib/utils";
import { logError } from "@/lib/utils/errors";

/**
 * The favorite + compare action overlay for a CarCard. Owns its own wishlist /
 * compare state so the card body stays presentational.
 */
export default function CarCardActions({
  carId,
  isWishlisted = false,
  onWishlistChange,
  isWishlistPage = false,
}: {
  carId: string;
  isWishlisted?: boolean;
  /** Called after a successful toggle so a list can drop the removed card. */
  onWishlistChange?: (removedCarId: string) => void;
  isWishlistPage?: boolean;
}) {
  const [isFavorite, setIsFavorite] = useState(isWishlisted);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsFavorite(isWishlisted);
  }, [isWishlisted]);

  useEffect(() => {
    setIsInCompare(compareUtils.getCompareList().includes(carId));
  }, [carId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    if (!isSignedIn) {
      toast.info("Sign in to save cars to your wishlist", {
        action: { label: "Sign in", onClick: () => router.push("/sign-in") },
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await toggleWishlist(carId);
      if (response.success) {
        setIsFavorite((prev) => !prev);
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
        if (isWishlistPage && isFavorite && onWishlistChange) {
          onWishlistChange(carId);
        }
      } else {
        toast.error(response.error?.message || "Couldn't update wishlist");
      }
    } catch (error) {
      logError("Failed to toggle wishlist", error);
      toast.error("Couldn't update wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      compareUtils.removeFromCompare(carId);
      setIsInCompare(false);
      toast.info("Removed from comparison");
    } else {
      const added = compareUtils.addToCompare(carId);
      if (added) {
        setIsInCompare(true);
        toast.success("Added to comparison");
      } else {
        toast.warning("You can compare up to 3 cars at a time");
      }
    }
    window.dispatchEvent(new Event("compareListUpdated"));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute right-2 top-2 z-20 flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full bg-white/80 p-1 shadow-sm transition-colors hover:bg-white hover:shadow-md sm:p-1.5"
              onClick={handleToggleFavorite}
              disabled={isLoading}
              size="icon"
              variant="ghost"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors duration-300 sm:h-4 sm:w-4 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                } ${isLoading ? "opacity-50" : ""}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFavorite ? "Remove from favorites" : "Add to favorites"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full bg-white/80 p-1 shadow-sm transition-colors hover:bg-white hover:shadow-md sm:p-1.5"
              onClick={handleToggleCompare}
              size="icon"
              variant="ghost"
              aria-label={isInCompare ? "Remove from compare" : "Add to compare"}
            >
              <Scale
                className={`h-3.5 w-3.5 transition-colors duration-300 sm:h-4 sm:w-4 ${
                  isInCompare ? "fill-primary text-primary" : "text-gray-500"
                }`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isInCompare ? "Remove from compare" : "Add to compare"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
