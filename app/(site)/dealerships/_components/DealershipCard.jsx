"use client";

import { Star, MapPin, Car, Building2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const DealershipCard = ({ dealership }) => {
    const { name, slug, logo, address, city, averageRating, totalReviews, carCount } =
        dealership;

    const formatRating = (rating) => {
        return rating ? rating.toFixed(1) : "0.0";
    };

    return (
        <motion.div
            whileHover={{
                scale: 1.02,
                boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            transition={{ duration: 0.2 }}
            className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all h-full flex flex-col"
        >
            <Link
                href={`/dealerships/${slug}`}
                className="flex flex-grow flex-col p-5 sm:p-6"
            >
                {/* Logo */}
                <div className="relative mx-auto mb-4 h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden">
                    {logo ? (
                        <Image
                            src={logo}
                            alt={name}
                            fill
                            className="object-contain"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                    )}
                </div>

                {/* Name */}
                <h3 className="text-center font-semibold text-base sm:text-lg tracking-tight line-clamp-1">
                    {name}
                </h3>

                {/* Rating */}
                <div className="mt-2 flex items-center justify-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                        {formatRating(averageRating)}
                    </span>
                    {totalReviews > 0 && (
                        <span className="text-xs text-muted-foreground">
                            ({totalReviews})
                        </span>
                    )}
                </div>

                {/* Spacer */}
                <div className="flex-grow" />

                {/* Metadata */}
                <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
                    {/* Location */}
                    {(city || address) && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{city || address}</span>
                        </div>
                    )}

                    {/* Car count */}
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="text-xs gap-1 font-normal"
                        >
                            <Car className="h-3 w-3" />
                            {carCount} {carCount === 1 ? "car" : "cars"}
                        </Badge>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default DealershipCard;
