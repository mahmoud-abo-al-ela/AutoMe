"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
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
import { useAuthRedirects } from "@/hooks/use-auth-redirects";

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
  const actionError = useActionError();
  const fmt = useFormatters();
  const [isFavorite, setIsFavorite] = useState(isWishlisted);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthRedirects();
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
        action: { label: t("signIn"), onClick: () => router.push(signIn) },
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
        toast.error(actionError(response.error, t("wishlistError")));
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

  // Figma: IconButton / OnMedia — white discs on the photo; 36px on the 2-up
  // phone card, 40px from sm. Compare is hidden on phones: it is a desktop task.
  const disc = "size-9 rounded-full bg-field text-foreground shadow-sm hover:bg-field sm:size-10";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute end-2 top-2 z-20 flex gap-2 sm:end-3 sm:top-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={disc}
              onClick={handleToggleFavorite}
              disabled={isLoading}
              size="icon"
              variant="ghost"
              aria-pressed={isFavorite}
              aria-label={t(isFavorite ? "removeFromFavorites" : "addToFavorites")}
            >
              <Heart
                className={`size-[18px] transition-colors duration-200 ${
                  isFavorite ? "fill-destructive text-destructive" : ""
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
              className={`${disc} max-sm:hidden ${isInCompare ? "!bg-primary !text-primary-foreground" : ""}`}
              onClick={handleToggleCompare}
              size="icon"
              variant="ghost"
              aria-pressed={isInCompare}
              aria-label={t(isInCompare ? "removeFromCompare" : "addToCompare")}
            >
              <Scale className="size-[18px]" />
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
