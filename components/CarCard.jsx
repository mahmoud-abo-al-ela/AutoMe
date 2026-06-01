"use client";
import {
  Building2,
  Calendar,
  ChevronRight,
  Heart,
  ExternalLink,
  MapPin,
  Fuel,
  Gauge,
  Scale,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import Image from "next/image";
import { toggleWishlist } from "@/actions/cars-listing";
import { usePathname } from "next/navigation";
import { compareUtils } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const CarCard = ({ car, onWishlistChange }) => {
  const [isFavorite, setIsFavorite] = useState(car?.isWishlisted || false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const isWishlistPage = pathname === "/wishlist";

  // Sync isFavorite state with car.isWishlisted prop
  useEffect(() => {
    setIsFavorite(car?.isWishlisted || false);
  }, [car?.isWishlisted]);

  useEffect(() => {
    const compareList = compareUtils.getCompareList();
    setIsInCompare(compareList.includes(car.id));
  }, [car.id]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await toggleWishlist(car.id);
      if (response.success) {
        setIsFavorite(!isFavorite);
        if (isWishlistPage && isFavorite && onWishlistChange) {
          onWishlistChange(car.id);
        }
      }
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      compareUtils.removeFromCompare(car.id);
      setIsInCompare(false);
      toast.info("Removed from comparison");
      window.dispatchEvent(new Event("compareListUpdated"));
    } else {
      const added = compareUtils.addToCompare(car.id);
      if (added) {
        setIsInCompare(true);
        toast.success("Added to comparison");
        window.dispatchEvent(new Event("compareListUpdated"));
      } else {
        toast.warning("You can compare up to 3 cars at a time");
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "mile",
      maximumFractionDigits: 0,
    }).format(mileage);
  };

  const carTitle = car.title || `${car.year} ${car.make} ${car.model}`;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="car-card rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col"
      >
        <Link href={`/cars/${car.id}`} className="flex flex-grow flex-col">
          <div className="relative overflow-hidden group">
            <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
              {car.images?.[0] && !imageError ? (
                <Image
                  src={car.images[0]}
                  alt={carTitle}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  width={500}
                  height={280}
                  onError={handleImageError}
                  priority={false}
                />
              ) : null}
            </div>
            {/* Action Buttons Top Right */}
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="cursor-pointer p-1 sm:p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md"
                    onClick={handleToggleFavorite}
                    disabled={isLoading}
                    size="icon"
                    variant="ghost"
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    <Heart
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${isFavorite
                        ? "fill-red-500 text-red-500"
                        : "text-gray-500"
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
                    className="cursor-pointer p-1 sm:p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md"
                    onClick={handleToggleCompare}
                    size="icon"
                    variant="ghost"
                    aria-label={
                      isInCompare ? "Remove from compare" : "Add to compare"
                    }
                  >
                    <Scale
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${isInCompare
                        ? "fill-blue-500 text-blue-500"
                        : "text-gray-500"
                        }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInCompare ? "Remove from compare" : "Add to compare"}
                </TooltipContent>
              </Tooltip>
            </div>
            {/* Rich Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Frosted Glass Price Badge */}
            <div className="absolute bottom-3 left-3 z-10">
              <span className="inline-flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/50 text-slate-900 font-extrabold text-sm sm:text-base px-3 py-1.5 rounded-lg shadow-lg transform transition-transform group-hover:scale-105 duration-300">
                {formatPrice(car.price)}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-5 flex flex-col flex-grow bg-white group-hover:bg-slate-50/50 transition-colors duration-300">
            <div className="mb-2 sm:mb-2.5">
              <h3 className="font-semibold text-sm sm:text-base tracking-tight line-clamp-1">
                {carTitle}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {car.trim && `${car.trim} • `}
                {car.engine || ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-y-2.5 text-[10px] sm:text-xs text-slate-600 mb-3 sm:mb-4">
              <div className="flex items-center">
                <div className="p-1 rounded-full bg-slate-100 mr-1.5 group-hover:bg-white transition-colors">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />
                </div>
                <span className="font-medium">{car.year}</span>
              </div>
              {car.mileage !== undefined && car.mileage !== null && (
                <div className="flex items-center">
                  <div className="p-1 rounded-full bg-blue-50 mr-1.5 group-hover:bg-white transition-colors">
                    <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                  </div>
                  <span className="font-medium truncate">{formatMileage(car.mileage)}</span>
                </div>
              )}
              {car.fuelType && (
                <div className="flex items-center">
                  <div className="p-1 rounded-full bg-amber-50 mr-1.5 group-hover:bg-white transition-colors">
                    <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" />
                  </div>
                  <span className="font-medium truncate">{car.fuelType}</span>
                </div>
              )}
              {car.location && (
                <div className="flex items-center">
                  <div className="p-1 rounded-full bg-emerald-50 mr-1.5 group-hover:bg-white transition-colors">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                  </div>
                  <span className="font-medium truncate">{car.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
              {car.bodyType && (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-[11px] font-medium bg-sky-50 text-sky-700 border-sky-100 rounded-full px-2.5 sm:px-3 py-0.5"
                >
                  {car.bodyType}
                </Badge>
              )}
              {car.transmission && (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full px-2.5 sm:px-3 py-0.5"
                >
                  {car.transmission}
                </Badge>
              )}
              {car.color && (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-[11px] font-medium bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-0.5"
                >
                  <span
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full inline-block border border-slate-300 shadow-inner"
                    style={{
                      backgroundColor: car.color
                        .toLowerCase()
                        .replace(/\s+/g, ""),
                    }}
                  ></span>
                  {car.color}
                </Badge>
              )}
            </div>

            {car.organization && (
              <>
                <div className="h-px bg-slate-100 w-full mb-3"></div>
                <div 
                  className="flex items-center gap-2 mb-3 sm:mb-4 px-1 group/dealer cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/dealerships/${car.organization.slug}`;
                  }}
                >
                  {car.organization.logo ? (
                    <Image
                      src={car.organization.logo}
                      alt={car.organization.name}
                      width={24}
                      height={24}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0 shadow-sm border border-slate-100 group-hover/dealer:border-primary/50 transition-colors"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 group-hover/dealer:border-primary/50 transition-colors">
                      <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    </div>
                  )}
                  <span className="text-[11px] sm:text-xs font-medium text-slate-600 truncate group-hover/dealer:text-primary transition-colors">
                    {car.organization.name}
                  </span>
                  <span className="text-[10px] text-primary opacity-0 group-hover/dealer:opacity-100 group-hover/dealer:translate-x-1 transition-all duration-300 ml-auto flex items-center">
                    View dealer <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </>
            )}

            <div className="mt-auto">
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-1.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group text-[11px] sm:text-xs py-1.5 sm:py-2 h-8 sm:h-9"
              >
                View Details
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </Button>
            </div>
          </div>
        </Link>
      </motion.div>
    </TooltipProvider>
  );
};

export default CarCard;
