"use client";

import { MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import type { DealershipDetail } from "../_lib/detail-types";
import { telHref } from "@/lib/utils/phone";

interface ContactCardProps {
    icon: LucideIcon;
    iconColorClass: string;
    label: string;
    value: string;
    href: string;
    external?: boolean;
}

const ContactCard = ({
    icon: Icon,
    iconColorClass,
    label,
    value,
    href,
    external = false,
}: ContactCardProps) => {
    const linkProps = external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {};

    return (
        <a
            href={href}
            className="group flex items-center gap-4 p-4 rounded-control border border-border bg-card hover:bg-muted hover:border-border transition-all duration-200"
            {...linkProps}
        >
            <div className={`flex-shrink-0 p-2.5 rounded-control bg-muted text-foreground`}>
                <Icon className={`h-5 w-5 ${iconColorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    {label}
                </p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {value}
                </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
        </a>
    );
};

export const DealershipContactInfo = ({
    dealership,
}: {
    dealership: DealershipDetail;
}) => {
    const t = useTranslations("dealerships.contact");
    const contacts: ContactCardProps[] = [];

    if (dealership.phone) {
        contacts.push({
            icon: Phone,
            iconColorClass: "text-positive",
            label: t("callNow"),
            value: dealership.phone,
            // International form, so it dials from a foreign SIM or abroad.
            href: telHref(dealership.phone) ?? `tel:${dealership.phone}`,
            external: false,
        });
    }

    if (dealership.email) {
        contacts.push({
            icon: Mail,
            iconColorClass: "text-primary",
            label: t("sendEmail"),
            value: dealership.email,
            href: `mailto:${dealership.email}`,
            external: false,
        });
    }

    if (dealership.website) {
        contacts.push({
            icon: Globe,
            iconColorClass: "text-primary",
            label: t("visitWebsite"),
            value: dealership.website.replace(/^https?:\/\//, ""),
            href: dealership.website,
            external: true,
        });
    }

    if (dealership.address) {
        contacts.push({
            icon: MapPin,
            iconColorClass: "text-destructive",
            label: t("getDirections"),
            value: dealership.address,
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealership.address)}`,
            external: true,
        });
    }

    if (contacts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {t("none")}
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((contact, index) => (
                <ContactCard key={index} {...contact} />
            ))}
        </div>
    );
};
