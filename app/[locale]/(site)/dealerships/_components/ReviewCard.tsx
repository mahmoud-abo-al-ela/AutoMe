"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { StarRating } from "@/components/common/StarRating";
import type { DealershipReview } from "../_lib/dealership-types";

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

/** One buyer's review: who and when, the stars, then their words. */
const ReviewCard = ({ review }: { review: DealershipReview }) => {
    const { rating, title, comment, user, createdAt } = review;
    const t = useTranslations("dealerships");
    const fmt = useFormatters();
    const name = user?.name || t("reviews.anonymous");

    return (
        <article className="flex flex-col gap-2 rounded-[20px] border border-border bg-card p-5 sm:px-6">
            <div className="flex items-center gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-caption font-semibold">
                    {user?.imageUrl ? (
                        <Image src={user.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                        <span aria-hidden>{initialsOf(name)}</span>
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate font-semibold">
                        {name}
                    </p>
                    <p className="text-micro text-muted-foreground">
                        {fmt.date(createdAt, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <span className="shrink-0">
                    <StarRating rating={rating} size={16} />
                    <span className="sr-only">{t("detail.reviews.outOfFive", { value: fmt.number(rating) })}</span>
                </span>
            </div>

            {/* The buyer's own words, in whatever language they wrote them. */}
            {title && (
                <h3 dir="auto" className="mt-1 text-body font-semibold">
                    {title}
                </h3>
            )}
            {comment && (
                <p dir="auto" className="text-body text-muted-foreground">
                    {comment}
                </p>
            )}
        </article>
    );
};

export { ReviewCard };
