"use client";
import { Calendar, Filter, Heart, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

const CarCard = ({ car }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
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

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{ duration: 0.2 }}
      className="car-card rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all h-[38vh] mb-5"
    >
      <Link href={`/cars/${car.id}`} className="block">
        <div className="relative overflow-hidden">
          <div className="aspect-video relative overflow-hidden">
            <img
              src={car.image}
              alt={car.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
          <button
            className="absolute cursor-pointer top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md z-10"
            onClick={toggleFavorite}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={`h-5 w-5 transition-colors duration-300 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-car-gray"
              }`}
            />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg tracking-tight line-clamp-1">
              {car.title}
            </h3>
            <div className="font-bold text-primary">
              {formatPrice(car.price)}
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground mb-4 flex-wrap gap-y-2">
            <div className="flex items-center mr-3">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center mr-3">
              <Filter className="h-4 w-4 mr-1" />
              <span>{formatMileage(car.mileage)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{car.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {car.features.slice(0, 3).map((feature, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-slate-50 hover:bg-slate-100"
              >
                {feature}
              </Badge>
            ))}
            {car.features.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs bg-slate-50 hover:bg-slate-100"
              >
                +{car.features.length - 3} more
              </Badge>
            )}
          </div>

          <div className="mt-auto">
            <Button
              size="sm"
              className="w-full bg-car-blue hover:bg-car-blue/90 text-white gap-1 rounded-md"
            >
              View Details <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CarCard;
