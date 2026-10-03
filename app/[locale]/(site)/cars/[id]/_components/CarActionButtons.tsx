"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Share2, Scale } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Save / Compare / Share (Figma: IconButton / Outline) — 44px squares with a
 * tooltip and an accessible name; pressed state is a filled asphalt square,
 * not a tint.
 */
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
  const t = useTranslations("carDetail.actions");
  const tCar = useTranslations("common.carActions");
  const square = "size-11 rounded-control border border-border bg-field hover:border-border-strong hover:bg-field";
  const pressed = "border-inverse bg-inverse text-inverse-foreground hover:bg-inverse-hover hover:border-inverse";

  const item = (label: string, node: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex gap-2">
      {item(
        tCar(isFavorite ? "removeFromFavorites" : "addToFavorites"),
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFavorite}
          disabled={isLoading}
          aria-pressed={isFavorite}
          aria-label={t(isFavorite ? "saved" : "save")}
          className={cn(square, isFavorite && pressed)}
        >
          <Heart className={cn("size-5", isFavorite && "fill-current")} />
        </Button>
      )}
      {item(
        tCar(isInCompare ? "removeFromCompare" : "addToCompare"),
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCompare}
          aria-pressed={isInCompare}
          aria-label={t("compare")}
          className={cn(square, isInCompare && pressed)}
        >
          <Scale className="size-5" />
        </Button>
      )}
      {item(
        t("shareThisCar"),
        <Button variant="ghost" size="icon" onClick={onShare} aria-label={t("share")} className={square}>
          <Share2 className="size-5" />
        </Button>
      )}
    </div>
  );
};

export default CarActionButtons;
