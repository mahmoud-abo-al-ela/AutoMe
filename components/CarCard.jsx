"use client";
import {
  Calendar,
  Heart,
  ExternalLink,
  MapPin,
  Fuel,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import Image from "next/image";
import { toggleWishlist } from "@/actions/cars-listing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const CarCard = ({ car }) => {
  const [isFavorite, setIsFavorite] = useState(car?.isWishlisted || false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle wishlist toggling
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await toggleWishlist(car.id);
      if (response.success) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
    } finally {
      setIsLoading(false);
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
        whileHover={{
          scale: 1.02,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        transition={{ duration: 0.2 }}
        className="car-card rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all h-full flex flex-col"
      >
        <Link href={`/cars/${car.id}`} className="flex flex-grow flex-col">
          <div className="relative overflow-hidden">
            <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
              <Image
                src={car.images[0]}
                alt={carTitle}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                width={500}
                height={300}
                onError={handleImageError}
                priority={false}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md z-10"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                  size="icon"
                  variant="ghost"
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                    } ${isLoading ? "opacity-50" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </TooltipContent>
            </Tooltip>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
            <div className="absolute bottom-3 left-3">
              <Badge
                variant="secondary"
                className="bg-white/90 text-black font-bold"
              >
                {formatPrice(car.price)}
              </Badge>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-grow">
            <div className="mb-3">
              <h3 className="font-semibold text-lg tracking-tight line-clamp-1">
                {carTitle}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {car.trim && `${car.trim} • `}
                {car.engine || ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <span>{car.year}</span>
              </div>
              {car.mileage !== undefined && car.mileage !== null && (
                <div className="flex items-center">
                  <Gauge className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <span>{formatMileage(car.mileage)}</span>
                </div>
              )}
              {car.fuelType && (
                <div className="flex items-center">
                  <Fuel className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <span>{car.fuelType}</span>
                </div>
              )}
              {car.location && (
                <div className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <span className="truncate">{car.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {car.bodyType && (
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 hover:bg-slate-100"
                >
                  {car.bodyType}
                </Badge>
              )}
              {car.transmission && (
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 hover:bg-slate-100"
                >
                  {car.transmission}
                </Badge>
              )}
              {car.color && (
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 hover:bg-slate-100 flex items-center gap-1"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
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

            <div className="mt-auto">
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-white gap-1 rounded-md cursor-pointer group"
              >
                View Details
                <ExternalLink className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </Link>
      </motion.div>
    </TooltipProvider>
  );
};

export default CarCard;
