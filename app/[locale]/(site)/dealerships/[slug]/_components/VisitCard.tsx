"use client";

import { useMemo } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { BuyerAccessNotice, useBuyerAccess } from "@/components/BuyerAccess";
import { useOpenStatusMessage } from "@/components/dealership/OpenStatusBadge";
import { DealershipTermsList, hasStatedTerms } from "@/components/dealership/DealershipTermsList";
import { getOpenStatus } from "@/lib/utils/open-status";
import { telHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import { MessageDealershipDialog } from "./MessageDealershipDialog";
import { ShareDealershipButton } from "./ShareDealershipButton";
import type { DealershipCar, DealershipDetail } from "../_lib/detail-types";

/** Google Maps' search link for an address: opens the app on a phone. */
export const directionsHref = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/**
 * Everything a buyer needs to act, kept in view beside the tabs: whether the
 * dealership is open, message / call / directions, and the terms they sell
 * on. On phones it sits above the tabs with the actions only — the terms and
 * the address are in the About tab there — and on the About tab itself
 * (`compact`) it drops them too, so they are not shown twice.
 */
export function VisitCard({
    dealership,
    newestCars,
    onShowAllCars,
    compact,
    className,
}: {
    dealership: DealershipDetail;
    newestCars: DealershipCar[];
    onShowAllCars: () => void;
    compact: boolean;
    className?: string;
}) {
    const t = useTranslations("dealerships");
    const describe = useOpenStatusMessage();
    const { can } = useBuyerAccess();
    const status = useMemo(() => getOpenStatus(dealership.workingHours), [dealership.workingHours]);

    const phoneHref = telHref(dealership.phone);
    const contactLinks = [
        phoneHref && { href: phoneHref, label: t("detail.visit.call"), Icon: Phone, external: false },
        dealership.address && {
            href: directionsHref(dealership.address),
            label: t("detail.visit.directions"),
            Icon: Navigation,
            external: true,
        },
    ].filter((link) => !!link);
    const showTerms = !compact && hasStatedTerms(dealership);
    const secondary = cn(buttonVariants({ variant: "outline-strong", size: "xl" }), "w-full");

    return (
        <aside
            aria-label={t("detail.visit.label")}
            className={cn("flex flex-col gap-5 rounded-[20px] border border-border bg-card p-5 sm:p-6", className)}
        >
            {status.statusKey !== "unavailable" && (
                <div>
                    <p className={cn("flex items-center gap-2 font-semibold", status.isOpen ? "text-positive" : "text-destructive")}>
                        <span aria-hidden className={cn("size-2 rounded-full", status.isOpen ? "bg-positive" : "bg-destructive")} />
                        {status.isOpen ? t("openStatus.openNow") : t("openStatus.closed")}
                    </p>
                    {status.statusKey !== "closed" && (
                        <p className="text-caption text-muted-foreground">{describe(status)}</p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-2.5">
                {/* Platform staff and the dealership's own team: why not, and where to go instead. */}
                <BuyerAccessNotice action="message" />
                {can("message") && newestCars.length > 0 && (
                    <MessageDealershipDialog dealership={dealership} newestCars={newestCars} onShowAllCars={onShowAllCars} />
                )}
                {contactLinks.length > 0 && (
                    <div className={cn("grid gap-2.5", contactLinks.length > 1 && "grid-cols-2")}>
                        {contactLinks.map(({ href, label, Icon, external }) => (
                            <a
                                key={label}
                                href={href}
                                className={secondary}
                                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            >
                                <Icon aria-hidden />
                                {label}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {showTerms && (
                <section className="hidden border-t border-border pt-5 lg:block">
                    <h2 className="mb-3 text-body font-semibold">{t("detail.buyingHere")}</h2>
                    <DealershipTermsList terms={dealership} stacked />
                </section>
            )}

            {!compact && (
                <div className="hidden flex-col items-start gap-2 border-t border-border pt-5 lg:flex">
                    {dealership.address && (
                        <p dir="auto" className="flex items-start gap-2 text-caption font-semibold">
                            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            {dealership.address}
                        </p>
                    )}
                    <ShareDealershipButton dealership={dealership} variant="link" size="sm" className="h-auto px-0" />
                </div>
            )}
        </aside>
    );
}
