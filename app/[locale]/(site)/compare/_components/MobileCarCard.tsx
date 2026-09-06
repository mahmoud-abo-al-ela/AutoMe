"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, getCarTitle } from "./utils";
import type { CompareCar } from "../_lib/compare-types";

/**
 * Mobile car card used in both carousel and side-by-side modes.
 */
const MobileCarCard = ({
  car,
  compact = false,
  onRemove,
}: {
  car: CompareCar;
  compact?: boolean;
  onRemove: (carId: string) => void;
}) => {
  const tCommon = useTranslations("common.actions");
  return (
    <div className={cn("relative p-3", compact && "p-2")}>
      <Button
        onClick={() => onRemove(car.id)}
        size="icon"
        variant="ghost"
        className="absolute top-1 end-1 z-10 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 hover:text-red-600 cursor-pointer shadow-sm"
        aria-label={`Remove ${getCarTitle(car)}`}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className={cn("flex gap-3", compact && "flex-col gap-2")}>
        <div className={cn("relative rounded-md bg-muted", compact ? "w-full aspect-[16/9]" : "w-1/3 aspect-[4/3]")}>
          {/* See CompareCarCard: an undefined `src` throws inside next/image. */}
          {car.images[0]?.url ? (
            <Image
              src={car.images[0].url}
              alt={getCarTitle(car)}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CarIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className={cn(compact ? "w-full" : "w-2/3")}>
          <h3 className={cn("font-semibold mb-1 line-clamp-1", compact ? "text-xs" : "text-sm")}>
            {getCarTitle(car)}
          </h3>
          <div className="flex items-center gap-1.5 mb-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-micro px-1.5 py-0">
              {formatPrice(car.price)}
            </Badge>
            <Badge variant="outline" className="text-micro px-1.5 py-0">
              {car.year}
            </Badge>
          </div>
          {!compact && (
            <Button asChild size="sm" className="w-full text-xs h-7">
              <Link href={`/cars/${car.id}`}>
                {tCommon("viewDetails")}
                <ArrowRight className="ms-1 h-3 w-3 rtl:rotate-180" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCarCard;
