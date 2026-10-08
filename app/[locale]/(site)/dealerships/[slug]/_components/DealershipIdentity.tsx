"use client";

import { ChevronRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { usePlaceNames } from "@/hooks/use-place-names";
import { resolveDealershipText, textDirection } from "@/lib/utils/dealership-text";
import type { DealershipDetail } from "../_lib/detail-types";

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

/**
 * Who the dealership is: the breadcrumb (desktop, as on a car's page), the
 * logo — or its initials on the marker yellow — the name, one line of facts
 * and the dealer's own description.
 */
export function DealershipIdentity({ dealership }: { dealership: DealershipDetail }) {
    const t = useTranslations("dealerships");
    const fmt = useFormatters();
    const place = usePlaceNames();
    const separator = <ChevronRight aria-hidden className="size-3.5 shrink-0 rtl:rotate-180" />;
    const description = resolveDealershipText(dealership, "description", fmt.locale);
    // "Tanta, Gharbia"; the region is dropped when it repeats the city (Cairo).
    const where = [...new Set([place.city(dealership.city), place.region(dealership.region)].filter(Boolean))].join(
        fmt.locale === "ar" ? "، " : ", "
    );

    return (
        <>
            <nav aria-label={t("breadcrumb.label")} className="mb-5 hidden items-center gap-2 text-caption text-muted-foreground md:flex">
                <Link href="/" className="hover:text-foreground hover:underline">
                    {t("breadcrumb.home")}
                </Link>
                {separator}
                <Link href="/dealerships" className="hover:text-foreground hover:underline">
                    {t("breadcrumb.dealerships")}
                </Link>
                {separator}
                <span aria-current="page" className="max-w-[24rem] truncate font-medium text-foreground">
                    {dealership.name}
                </span>
            </nav>

            <header className="flex items-center gap-4 sm:gap-6">
                {dealership.logo ? (
                    // Dealership logos are arbitrary remote URLs (see MainHeader).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={dealership.logo}
                        alt=""
                        className="size-16 shrink-0 rounded-[16px] border-2 border-border-strong bg-field object-contain sm:size-24 sm:rounded-[20px]"
                    />
                ) : (
                    <span
                        aria-hidden
                        className="flex size-16 shrink-0 items-center justify-center rounded-[16px] border-2 border-border-strong bg-marker text-2xl font-black text-marker-foreground sm:size-24 sm:rounded-[20px] sm:text-[2rem]"
                    >
                        {initialsOf(dealership.name)}
                    </span>
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h1 className="text-h1 font-black">{dealership.name}</h1>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                        {dealership.totalReviews > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                <Star aria-hidden className="size-4 fill-current" />
                                {fmt.number(dealership.averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                <span className="font-normal text-muted-foreground">
                                    ·{" "}
                                    {t("detail.reviewCount", {
                                        count: dealership.totalReviews,
                                        value: fmt.number(dealership.totalReviews),
                                    })}
                                </span>
                            </span>
                        ) : (
                            <span>{t("detail.noReviewsYet")}</span>
                        )}
                        {where && <span aria-hidden>·</span>}
                        {where && <span>{where}</span>}
                        <span aria-hidden>·</span>
                        <span>
                            {t("detail.memberSince", {
                                // Month and year; formatDate's default adds the day.
                                date: fmt.date(dealership.createdAt, { day: undefined, month: "long", year: "numeric" }),
                            })}
                        </span>
                    </p>
                </div>
            </header>

            {description && (
                // In the reader's language once translated; until then the
                // dealer's own words, set in their language's direction.
                <p {...textDirection(description)} className="mt-4 max-w-3xl text-body">
                    {description.text}
                </p>
            )}
        </>
    );
}
