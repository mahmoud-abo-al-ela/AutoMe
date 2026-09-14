"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getOpenStatus, type OpenStatus } from "@/lib/utils/open-status";
import { formatClockTime } from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";

/**
 * Turn a status into its sentence. The status itself is computed in
 * lib/utils/open-status, which knows nothing about language — it hands back a
 * key and its parameters so both this badge and the working-hours card can word
 * it in the reader's locale.
 */
export const useOpenStatusMessage = () => {
    const t = useTranslations("dealerships");
    const locale = useLocale() as Locale;

    return (status: OpenStatus) =>
        t(`openStatus.${status.statusKey}`, {
            // The clock face is localised here rather than in the message, so
            // Arabic gets Eastern digits and the right meridiem.
            time: status.params?.time
                ? formatClockTime(status.params.time, locale)
                : "",
            day: status.params?.day ? t(`days.${status.params.day}`) : "",
        });
};

export const OpenStatusBadge = ({
    workingHours,
    className = "",
}: {
    workingHours?: WorkingHoursEntry[] | null;
    className?: string;
}) => {
    const t = useTranslations("dealerships");
    const describe = useOpenStatusMessage();
    const status = useMemo(() => getOpenStatus(workingHours), [workingHours]);

    return (
        <Badge
            variant="outline"
            className={`gap-1.5 px-2.5 py-1 text-xs font-medium border-0 ${status.isOpen
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                } ${className}`}
        >
            <span
                className={`h-2 w-2 rounded-full ${status.isOpen
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
            />
            <span>
                {status.isOpen
                    ? t("openStatus.openNow")
                    : t("openStatus.closed")}
            </span>
            {/* The detail is dropped when it would only repeat the label — a
                plain "closed", with no next opening to point at. */}
            {status.statusKey !== "closed" && (
                <span className="text-micro opacity-70">
                    · {describe(status)}
                </span>
            )}
        </Badge>
    );
};
