"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Fuel, Calendar, Gauge } from "lucide-react";
import { formatPrice, formatMileage, getCarTitle } from "./utils";

/**
 * Card-based car display for the compare page sticky header row.
 *
 * Features:
 *  - Image with gradient overlay showing price
 *  - Remove button with AnimatePresence exit animation
 *  - Quick stats row: year, mileage, fuel type as small badges
 *  - "View Details" link button
 *  - Subtle hover elevation via framer-motion
 */
const CompareCarCard = ({ car, onRemove }) => {
    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1)" }}
                className="relative bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
                {/* Remove button */}
                <Button
                    onClick={() => onRemove(car.id)}
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 z-10 h-7 w-7 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 hover:text-red-600 cursor-pointer shadow-sm print:hidden"
                    aria-label={`Remove ${getCarTitle(car)} from comparison`}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>

                {/* Image with gradient overlay */}
                <div className="aspect-[4/3] relative">
                    <Image
                        src={car.images[0]?.url}
                        alt={getCarTitle(car)}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
                    <Badge className="absolute bottom-2 left-2 bg-white/90 text-gray-900 hover:bg-white text-xs font-semibold shadow-sm">
                        {formatPrice(car.price)}
                    </Badge>
                </div>

                {/* Car info */}
                <div className="p-3">
                    <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-1">
                        {getCarTitle(car)}
                    </h3>

                    {/* Quick stats badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 gap-1"
                        >
                            <Calendar className="h-2.5 w-2.5" />
                            {car.year}
                        </Badge>
                        {car.mileage && (
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 gap-1"
                            >
                                <Gauge className="h-2.5 w-2.5" />
                                {formatMileage(car.mileage)}
                            </Badge>
                        )}
                        {car.fuelType && (
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 gap-1"
                            >
                                <Fuel className="h-2.5 w-2.5" />
                                {car.fuelType}
                            </Badge>
                        )}
                    </div>

                    {/* View Details link */}
                    <Button asChild size="sm" className="w-full text-xs h-8 print:hidden">
                        <Link href={`/cars/${car.id}`}>
                            View Details
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CompareCarCard;
