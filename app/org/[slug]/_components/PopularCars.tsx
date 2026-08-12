"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, CarFront } from "lucide-react";
import Image from "next/image";
import type { CarStatus } from "@/lib/generated/prisma";

/**
 * A wishlisted car from getPopularCarsData(). `price` arrives as a number: the
 * repository converts Car.price out of Prisma's Decimal before returning it.
 * `image` is the first image, or null when the car has none.
 */
export type PopularCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: CarStatus;
  image: string | null;
  savedCount: number;
};

const PopularCars = ({ cars }: { cars: PopularCar[] }) => {
  if (!cars || cars.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Popular Cars</CardTitle>
          <CardDescription>Most wishlisted inventory</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center h-[300px]">
          <div className="bg-muted rounded-full p-4 mb-4">
            <CarFront className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No wishlisted cars yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
            When users save cars to their wishlist, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: CarStatus) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
      case "SOLD": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
      case "UNAVAILABLE": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200";
      default: return "";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Popular Cars</CardTitle>
        <CardDescription>Top 5 most wishlisted inventory</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {cars.map((car, idx) => (
            <div key={car.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
              <div className="flex-shrink-0 relative w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {car.image ? (
                  <Image 
                    src={car.image} 
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <CarFront className="h-6 w-6 text-muted-foreground" />
                )}
                {/* Rank Badge */}
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-background rounded-full flex items-center justify-center shadow-sm border text-[10px] font-bold z-10">
                  {idx + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {car.year} {car.make} {car.model}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground font-mono">
                    ${car.price.toLocaleString()}
                  </p>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(car.status)}`}>
                    {car.status.toLowerCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-1.5 justify-end text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-bold">{car.savedCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularCars;
