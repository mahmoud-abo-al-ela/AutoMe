"use client";

import { useMemo } from "react";
import { Globe, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { BuyerAccessNotice, useBuyerAccess } from "@/components/BuyerAccess";
import { useOpenStatusMessage } from "@/components/dealership/OpenStatusBadge";
import { getOpenStatus } from "@/lib/utils/open-status";
import { telHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import { MessageDealershipDialog } from "./MessageDealershipDialog";
import type { DealershipCar, DealershipDetail } from "../_lib/detail-types";

/** Google Maps' search link for an address: opens the app on a phone. */
const directionsHref = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Open now / Closed, and when that changes. Nothing when the hours are not set. */
export function OpenStatusLine({ dealership }: { dealership: DealershipDetail }) {
    const t = useTranslations("dealerships");
    const describe = useOpenStatusMessage();
    const status = useMemo(() => getOpenStatus(dealership.workingHours), [dealership.workingHours]);
    if (status.statusKey === "unavailable") return null;

    return (
        <div>
            <p className={cn("flex items-center gap-2 font-semibold", status.isOpen ? "text-positive" : "text-destructive")}>
                <span aria-hidden className={cn("size-2 rounded-full", status.isOpen ? "bg-positive" : "bg-destructive")} />
                {status.isOpen ? t("openStatus.openNow") : t("openStatus.closed")}
            </p>
            {status.statusKey !== "closed" && <p className="text-caption text-muted-foreground">{describe(status)}</p>}
        </div>
    );
}

export function VisitActions({
    dealership,
    newestCars,
    onShowAllCars,
    inline = false,
    className,
}: {
    dealership: DealershipDetail;
    newestCars: DealershipCar[];
    onShowAllCars: () => void;
    inline?: boolean;
    className?: string;
}) {
    const t = useTranslations("dealerships");
    const { can } = useBuyerAccess();
    const phoneHref = telHref(dealership.phone);
    const contactLinks = [
        phoneHref && {
            href: phoneHref,
            // In the header the number itself: on a computer it is read, not tapped.
            label: inline ? dealership.phone! : t("detail.visit.call"),
            Icon: Phone,
            external: false,
        },
        dealership.address && {
            // Searches the dealer's own text, whatever language the page is in.
            href: directionsHref(dealership.address),
            label: t("detail.visit.directions"),
            Icon: Navigation,
            external: true,
        },
        // The visit card leaves the website to the About tab's header.
        inline && dealership.website && {
            href: dealership.website,
            label: t("detail.about.website"),
            Icon: Globe,
            external: true,
        },
    ].filter((link) => !!link);
    const secondary = cn(buttonVariants({ variant: "outline-strong", size: "xl" }), "w-full");

    return (
        <div className={cn("flex flex-col gap-2.5", className)}>
            <BuyerAccessNotice action="message" />
            {can("message") && newestCars.length > 0 && (
                <MessageDealershipDialog
                    dealership={dealership}
                    newestCars={newestCars}
                    onShowAllCars={onShowAllCars}
                />
            )}
            {contactLinks.length > 0 && (
                <div className={cn("grid gap-2.5", !inline && contactLinks.length > 1 && "grid-cols-2")}>
                    {contactLinks.map(({ href, label, Icon, external }) => (
                        <a
                            key={label}
                            href={href}
                            className={secondary}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                            <Icon aria-hidden />
                            <span dir={Icon === Phone && inline ? "ltr" : undefined}>{label}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
