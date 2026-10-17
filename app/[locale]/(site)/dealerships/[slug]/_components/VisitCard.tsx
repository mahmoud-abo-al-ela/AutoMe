"use client";

import { useTranslations } from "next-intl";
import { DealershipTermsList, hasStatedTerms } from "@/components/dealership/DealershipTermsList";
import { cn } from "@/lib/utils";
import { OpenStatusLine, VisitActions } from "./VisitActions";
import { ShareDealershipButton } from "./ShareDealershipButton";
import type { DealershipCar, DealershipDetail } from "../_lib/detail-types";

export function VisitCard({
    dealership,
    newestCars,
    onShowAllCars,
    className,
}: {
    dealership: DealershipDetail;
    newestCars: DealershipCar[];
    onShowAllCars: () => void;
    className?: string;
}) {
    const t = useTranslations("dealerships");

    return (
        <aside
            aria-label={t("detail.visit.label")}
            className={cn("flex flex-col gap-5 rounded-[20px] border border-border bg-card p-5 sm:p-6", className)}
        >
            <OpenStatusLine dealership={dealership} />
            <VisitActions dealership={dealership} newestCars={newestCars} onShowAllCars={onShowAllCars} />

            {hasStatedTerms(dealership) && (
                <section className="hidden border-t border-border pt-5 lg:block">
                    <h2 className="mb-3 text-body font-semibold">{t("detail.buyingHere")}</h2>
                    <DealershipTermsList terms={dealership} stacked />
                </section>
            )}

            <div className="hidden flex-col items-start border-t border-border pt-5 lg:flex">
                <ShareDealershipButton dealership={dealership} variant="link" size="sm" className="h-auto px-0" />
            </div>
        </aside>
    );
}
