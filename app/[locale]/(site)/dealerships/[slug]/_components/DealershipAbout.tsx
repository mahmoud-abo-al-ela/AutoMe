"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { resolveDealershipText, textDirection } from "@/lib/utils/dealership-text";
import { buttonVariants } from "@/components/ui/button";
import { DealershipTermsList, hasStatedTerms } from "@/components/dealership/DealershipTermsList";
import { telHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import { DealershipWorkingHours } from "./DealershipWorkingHours";
import { directionsHref } from "./VisitCard";
import type { DealershipDetail } from "../_lib/detail-types";

const card = "rounded-[20px] border border-border bg-card p-5 sm:p-6";
const heading = "mb-4 text-h3 font-semibold";

/**
 * How the dealership sells, when it is open, and how to reach it. The visit
 * card beside it drops its own copy of the terms and the address on this tab.
 */
export function DealershipAbout({ dealership }: { dealership: DealershipDetail }) {
    const t = useTranslations("dealerships.detail");
    const phoneHref = telHref(dealership.phone);
    // In the reader's language; Get directions still searches the dealer's own text.
    const address = resolveDealershipText(dealership, "address", useLocale() as Locale);
    const contacts = [
        address && { label: t("about.address"), value: <span {...textDirection(address)}>{address.text}</span> },
        dealership.phone && {
            label: t("about.phone"),
            value: phoneHref ? (
                <a href={phoneHref} dir="ltr" className="text-primary underline-offset-2 hover:underline">
                    {dealership.phone}
                </a>
            ) : (
                <span dir="ltr">{dealership.phone}</span>
            ),
        },
        dealership.email && {
            label: t("about.email"),
            value: (
                <a href={`mailto:${dealership.email}`} className="break-all text-primary underline-offset-2 hover:underline">
                    {dealership.email}
                </a>
            ),
        },
        dealership.website && {
            label: t("about.website"),
            value: (
                <a
                    href={dealership.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="break-all text-primary underline-offset-2 hover:underline"
                >
                    {dealership.website.replace(/^https?:\/\//, "")}
                </a>
            ),
        },
    ].filter((row) => !!row);

    return (
        <div className="flex flex-col gap-6">
            {hasStatedTerms(dealership) && (
                <section className={card}>
                    <h2 className={heading}>{t("buyingHere")}</h2>
                    <DealershipTermsList terms={dealership} />
                </section>
            )}

            <div className="grid items-start gap-6 md:grid-cols-2">
                <DealershipWorkingHours workingHours={dealership.workingHours} className={card} />

                <section className={card}>
                    <h2 className={heading}>{t("about.contact")}</h2>
                    {contacts.length > 0 ? (
                        <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 gap-y-3 text-body">
                            {contacts.map((row) => (
                                <div key={row.label} className="contents">
                                    <dt className="text-muted-foreground">{row.label}</dt>
                                    <dd>{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-muted-foreground">{t("about.noContact")}</p>
                    )}
                    {dealership.address && (
                        <a
                            href={directionsHref(dealership.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: "outline-strong", size: "xl" }), "mt-5 w-full")}
                        >
                            {t("about.getDirections")}
                        </a>
                    )}
                </section>
            </div>
        </div>
    );
}
