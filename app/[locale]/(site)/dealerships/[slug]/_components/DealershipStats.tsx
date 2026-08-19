"use client";

import { useEffect, useRef, useState } from "react";
import { Car, Star, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import type { DealershipDetail } from "../_lib/detail-types";

/**
 * Animated counter hook that counts up from 0 to a target value.
 */
function useCountUp(
    target: number,
    duration = 1.5,
    startCounting = false
): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!startCounting) return;

        const numericTarget = Number(target) || 0;
        if (numericTarget === 0) {
            setCount(0);
            return;
        }

        let startTime: number | null = null;
        let animationFrame = 0;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min(
                (timestamp - startTime) / (duration * 1000),
                1
            );

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * numericTarget);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration, startCounting]);

    return count;
}

/**
 * Format the createdAt date into "Member since Jan 2024" format.
 */
function formatMemberSince(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

const StatCard = ({
    icon: Icon,
    iconBgClass,
    iconColorClass,
    value,
    label,
    isAnimatedNumber = false,
    decimals = 0,
    onClick,
    delay = 0,
}: {
    icon: LucideIcon;
    iconBgClass: string;
    iconColorClass: string;
    value: number | string;
    label: string;
    isAnimatedNumber?: boolean;
    decimals?: number;
    onClick?: () => void;
    delay?: number;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const animatedValue = useCountUp(
        isAnimatedNumber ? Number(value) : 0,
        1.5,
        isAnimatedNumber && isInView
    );

    const displayValue = isAnimatedNumber
        ? decimals > 0
            ? animatedValue.toFixed(decimals)
            : Math.round(animatedValue)
        : value;

    const isClickable = !!onClick;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card
                className={`transition-all duration-200 ${isClickable
                        ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        : ""
                    }`}
                onClick={onClick}
            >
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${iconBgClass}`}
                        >
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColorClass}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold text-slate-900 tabular-nums">
                                {displayValue}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {label}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export const DealershipStats = ({
    dealership,
}: {
    dealership: DealershipDetail;
}) => {
    const formatRating = (rating: number | null | undefined) => {
        return rating ? rating.toFixed(1) : "0.0";
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
                icon={Car}
                iconBgClass="from-blue-100 to-blue-50"
                iconColorClass="text-blue-600"
                value={dealership.carCount || 0}
                label="Available Cars"
                isAnimatedNumber
                delay={0}
                onClick={() => scrollToSection("dealership-inventory")}
            />

            <StatCard
                icon={Star}
                iconBgClass="from-yellow-100 to-amber-50"
                iconColorClass="text-yellow-600"
                value={parseFloat(formatRating(dealership.averageRating))}
                label="Average Rating"
                isAnimatedNumber
                decimals={1}
                delay={0.1}
                onClick={() => scrollToSection("dealership-reviews")}
            />

            <StatCard
                icon={Calendar}
                iconBgClass="from-emerald-100 to-green-50"
                iconColorClass="text-emerald-600"
                value={`Member since ${formatMemberSince(dealership.createdAt)}`}
                label="Established"
                isAnimatedNumber={false}
                delay={0.2}
            />
        </div>
    );
};
