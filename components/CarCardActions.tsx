"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import { useFormatters } from "@/hooks/use-formatters";

/** Mirrors the cap enforced by compareUtils.addToCompare. */
const COMPARE_LIMIT = 3;

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
  const t = useTranslations("common.carActions");
  const fmt = useFormatters();
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
      toast.info(t("signInToSave"), {
        action: { label: t("signIn"), onClick: () => router.push("/sign-in") },
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
        toast.error(response.error?.message || t("wishlistError"));
      }
    } catch (error) {
      logError("Failed to toggle wishlist", error);
      toast.error(t("wishlistError"));
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
      toast.info(t("compareRemoved"));
    } else {
      const added = compareUtils.addToCompare(carId);
      if (added) {
        setIsInCompare(true);
        toast.success(t("compareAdded"));
      } else {
        toast.warning(
          t("compareLimit", { max: fmt.number(COMPARE_LIMIT) })
        );
      }
    }
    window.dispatchEvent(new Event("compareListUpdated"));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute end-2 top-2 z-20 flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full bg-white/80 p-1 shadow-sm transition-colors hover:bg-white hover:shadow-md sm:p-1.5"
              onClick={handleToggleFavorite}
              disabled={isLoading}
              size="icon"
              variant="ghost"
              aria-label={t(isFavorite ? "removeFromFavorites" : "addToFavorites")}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors duration-300 sm:h-4 sm:w-4 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                } ${isLoading ? "opacity-50" : ""}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t(isFavorite ? "removeFromFavorites" : "addToFavorites")}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full bg-white/80 p-1 shadow-sm transition-colors hover:bg-white hover:shadow-md sm:p-1.5"
              onClick={handleToggleCompare}
              size="icon"
              variant="ghost"
              aria-label={t(isInCompare ? "removeFromCompare" : "addToCompare")}
            >
              <Scale
                className={`h-3.5 w-3.5 transition-colors duration-300 sm:h-4 sm:w-4 ${
                  isInCompare ? "fill-primary text-primary" : "text-gray-500"
                }`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t(isInCompare ? "removeFromCompare" : "addToCompare")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
