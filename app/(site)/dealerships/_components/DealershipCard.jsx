"use client";

import { useState } from "react";
import { MapPin, Car, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { StarRating } from "@/components/common/StarRating";
import { getOpenStatus } from "../[slug]/_components/OpenStatusBadge";

const formatPrice = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);

const DealershipCard = ({ dealership, index = 0 }) => {
    const {
        name,
        slug,
        logo,
        address,
        city,
        averageRating,
        totalReviews,
        carCount,
        brands = [],
        priceFrom,
        workingHours,
    } = dealership;

    const [imgError, setImgError] = useState(false);
    const reduceMotion = useReducedMotion();

    const openStatus = workingHours?.length ? getOpenStatus(workingHours) : null;
    const showLogo = logo && !imgError;

    return (
        <motion.div
            whileHover={reduceMotion ? undefined : { y: -4 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <Link
                href={`/dealerships/${slug}`}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-center text-card-foreground shadow-sm transition-shadow hover:shadow-lg sm:p-6"
            >
                {/* Logo */}
                <div className="relative mx-auto mb-4 h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                    {showLogo ? (
                        <Image
                            src={logo}
                            alt={name}
                            fill
                            sizes="80px"
                            className="object-contain"
                            onError={() => setImgError(true)}
                            priority={index < 4}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-brand-accent">
                            <Building2 className="h-9 w-9 text-white" />
                        </div>
                    )}
                </div>

                {/* Name */}
                <h3 className="line-clamp-1 text-base font-semibold tracking-tight sm:text-lg">
                    {name}
                </h3>

                {/* Rating */}
                <div className="mt-2 flex items-center justify-center gap-1.5">
                    {totalReviews > 0 ? (
                        <>
                            <StarRating rating={averageRating} size={15} />
                            <span className="text-sm font-medium">
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({totalReviews})
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">No reviews yet</span>
                    )}
                </div>

                {/* Location + open status */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {(city || address) && (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="line-clamp-1">{city || address}</span>
                        </span>
                    )}
                    {openStatus?.isOpen && (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Open now
                        </span>
                    )}
                </div>

                {/* Brands carried */}
                {brands.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                        {brands.map((brand) => (
                            <span
                                key={brand}
                                className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                                {brand}
                            </span>
                        ))}
                    </div>
                )}

                {/* Spacer keeps the footer aligned across uneven cards */}
                <div className="flex-grow" />

                {/* Footer: inventory + price-from */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 border-t border-border pt-4 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                        {carCount} {carCount === 1 ? "car" : "cars"}
                    </span>
                    {priceFrom ? (
                        <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                                from {formatPrice(priceFrom)}
                            </span>
                        </>
                    ) : null}
                </div>
            </Link>
        </motion.div>
    );
};

export default DealershipCard;
