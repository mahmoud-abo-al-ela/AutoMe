"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
    Star,
    Building2,
    Phone,
    Mail,
    Globe,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { OpenStatusBadge } from "./OpenStatusBadge";
import { ShareDealershipButton } from "./ShareDealershipButton";
import type { DealershipDetail } from "../_lib/detail-types";

const MAX_DESCRIPTION_LINES = 2;
const LINE_HEIGHT_PX = 24; // approximate line height for text-sm/base
const MAX_HEIGHT_PX = MAX_DESCRIPTION_LINES * LINE_HEIGHT_PX;

export const DealershipHeader = ({
    dealership,
}: {
    dealership: DealershipDetail;
}) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isDescriptionClamped, setIsDescriptionClamped] = useState(false);
    const descriptionRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (descriptionRef.current) {
            setIsDescriptionClamped(
                descriptionRef.current.scrollHeight > MAX_HEIGHT_PX + 4
            );
        }
    }, [dealership.description]);

    const formatRating = (rating: number | null | undefined) => {
        return rating ? rating.toFixed(1) : "0.0";
    };

    const renderStars = (rating: number | null | undefined) => {
        const stars: React.ReactNode[] = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) - fullStars >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400/50 text-yellow-400"
                    />
                );
            } else {
                stars.push(
                    <Star
                        key={i}
                        className="h-4 w-4 text-gray-300"
                    />
                );
            }
        }
        return stars;
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-md border border-slate-100 mb-6">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl overflow-hidden bg-white relative shadow-md ring-1 ring-slate-200/60">
                            {dealership.logo ? (
                                <Image
                                    src={dealership.logo}
                                    alt={dealership.name}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 160px"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                    <Building2 className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name + Verified Badge */}
                        <div className="flex flex-wrap items-start gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                                {dealership.name}
                            </h1>
                        </div>

                        {/* Rating + Open Status Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            {/* Star Rating */}
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                    {renderStars(dealership.averageRating)}
                                </div>
                                <span className="text-lg font-semibold text-slate-900">
                                    {formatRating(dealership.averageRating)}
                                </span>
                                {dealership.totalReviews > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        ({dealership.totalReviews} review
                                        {dealership.totalReviews !== 1 ? "s" : ""})
                                    </span>
                                )}
                            </div>

                            {/* Separator */}
                            <span className="hidden sm:inline-block w-px h-5 bg-slate-300" />

                            {/* Open/Closed Status */}
                            <OpenStatusBadge workingHours={dealership.workingHours} />
                        </div>

                        {/* Description with Read More */}
                        {dealership.description && (
                            <div className="mb-5">
                                <div
                                    ref={descriptionRef}
                                    className={`text-sm sm:text-base text-slate-600 leading-relaxed transition-all duration-300 ${!isDescriptionExpanded && isDescriptionClamped
                                        ? "line-clamp-2"
                                        : ""
                                        }`}
                                >
                                    {dealership.description}
                                </div>
                                {isDescriptionClamped && (
                                    <button
                                        onClick={() =>
                                            setIsDescriptionExpanded(!isDescriptionExpanded)
                                        }
                                        className="inline-flex items-center gap-1 mt-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                    >
                                        {isDescriptionExpanded ? (
                                            <>
                                                Show less
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </>
                                        ) : (
                                            <>
                                                Read more
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {dealership.phone && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer"
                                        >
                                            <a href={`tel:${dealership.phone}`}>
                                                <Phone className="h-4 w-4 text-green-600" />
                                                <span className="hidden sm:inline">Call</span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{dealership.phone}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {dealership.email && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer"
                                        >
                                            <a href={`mailto:${dealership.email}`}>
                                                <Mail className="h-4 w-4 text-blue-600" />
                                                <span className="hidden sm:inline">Email</span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{dealership.email}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {dealership.website && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer"
                                        >
                                            <a
                                                href={dealership.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Globe className="h-4 w-4 text-purple-600" />
                                                <span className="hidden sm:inline">Website</span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Visit website</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {dealership.address && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer"
                                        >
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealership.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <MapPin className="h-4 w-4 text-red-500" />
                                                <span className="hidden sm:inline">Directions</span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{dealership.address}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            <ShareDealershipButton
                                dealership={dealership}
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-white/80 hover:bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
