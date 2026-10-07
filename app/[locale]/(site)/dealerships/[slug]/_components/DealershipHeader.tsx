"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { StarRating } from "@/components/common/StarRating";
import {
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
import { OpenStatusBadge } from "@/components/dealership/OpenStatusBadge";
import { ShareDealershipButton } from "./ShareDealershipButton";
import type { DealershipDetail } from "../_lib/detail-types";
import { telHref } from "@/lib/utils/phone";

const MAX_DESCRIPTION_LINES = 2;
const LINE_HEIGHT_PX = 24; // approximate line height for text-sm/base
const MAX_HEIGHT_PX = MAX_DESCRIPTION_LINES * LINE_HEIGHT_PX;

export const DealershipHeader = ({
    dealership,
}: {
    dealership: DealershipDetail;
}) => {
    const t = useTranslations("dealerships.header");
    const fmt = useFormatters();
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

    const formatRating = (rating: number | null | undefined) =>
        fmt.number(rating || 0, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

    return (
        <div className="relative overflow-hidden rounded-control bg-card border border-border mb-6">
            {/* Decorative background elements */}

            <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-control overflow-hidden bg-card relative ring-1 ring-slate-200/60">
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
                                <div className="w-full h-full flex items-center justify-center bg-marker border-2 border-border-strong text-foreground">
                                    {/* Initials on marker yellow, as on the dealership cards. */}
                                    <span aria-hidden className="text-[2.5rem] font-black sm:text-[3rem]">
                                        {dealership.name
                                            .split(/\s+/)
                                            .filter(Boolean)
                                            .map((word: string) => word[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name + Verified Badge */}
                        <div className="flex flex-wrap items-start gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                                {dealership.name}
                            </h1>
                        </div>

                        {/* Rating + Open Status Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            {/* Star Rating */}
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                    <StarRating
                                        rating={dealership.averageRating || 0}
                                        size={16}
                                    />
                                </div>
                                <span className="text-lg font-semibold text-foreground">
                                    {formatRating(dealership.averageRating)}
                                </span>
                                {dealership.totalReviews > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        {t("reviewCount", {
                                            count: dealership.totalReviews,
                                            value: fmt.number(dealership.totalReviews),
                                        })}
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
                                    className={`text-sm sm:text-base text-muted-foreground leading-relaxed transition-all duration-300 ${!isDescriptionExpanded && isDescriptionClamped
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
                                                {t("showLess")}
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </>
                                        ) : (
                                            <>
                                                {t("readMore")}
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
                                            className="gap-2 bg-field/80 hover:bg-card cursor-pointer"
                                        >
                                            <a href={telHref(dealership.phone) ?? `tel:${dealership.phone}`}>
                                                <Phone className="h-4 w-4 text-positive" />
                                                <span className="hidden sm:inline">{t("call")}</span>
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
                                            className="gap-2 bg-field/80 hover:bg-card cursor-pointer"
                                        >
                                            <a href={`mailto:${dealership.email}`}>
                                                <Mail className="h-4 w-4 text-primary" />
                                                <span className="hidden sm:inline">{t("email")}</span>
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
                                            className="gap-2 bg-field/80 hover:bg-card cursor-pointer"
                                        >
                                            <a
                                                href={dealership.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Globe className="h-4 w-4 text-primary" />
                                                <span className="hidden sm:inline">{t("website")}</span>
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t("visitWebsite")}</p>
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
                                            className="gap-2 bg-field/80 hover:bg-card cursor-pointer"
                                        >
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealership.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <MapPin className="h-4 w-4 text-destructive" />
                                                <span className="hidden sm:inline">{t("directions")}</span>
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
                                className="gap-2 bg-field/80 hover:bg-card"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
