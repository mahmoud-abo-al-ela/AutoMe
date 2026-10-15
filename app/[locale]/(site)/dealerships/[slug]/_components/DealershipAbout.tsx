"use client";

import { useTranslations } from "next-intl";
import { DealershipTermsList, hasStatedTerms } from "@/components/dealership/DealershipTermsList";
import { cn } from "@/lib/utils";
import { DealershipWorkingHours } from "./DealershipWorkingHours";
import type { DealershipDetail } from "../_lib/detail-types";

const card = "rounded-[20px] border border-border bg-card p-5 sm:p-6";

/**
 * How the dealership sells and when it is open, side by side. Message and
 * Directions are in the header on this tab, and the address in its facts
 * line, so the page leaves the visit card out here.
 */
export function DealershipAbout({ dealership }: { dealership: DealershipDetail }) {
    const t = useTranslations("dealerships.detail");
    const showTerms = hasStatedTerms(dealership);

    return (
        <div className={cn("grid items-start gap-6", showTerms && "md:grid-cols-2")}>
            {showTerms && (
                <section className={card}>
                    <h2 className="mb-4 text-h3 font-semibold">{t("buyingHere")}</h2>
                    <DealershipTermsList terms={dealership} stacked />
                </section>
            )}
            <DealershipWorkingHours workingHours={dealership.workingHours} className={card} />
        </div>
    );
}
