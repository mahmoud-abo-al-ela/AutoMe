"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TimeRange } from "@/components/common/TimeRange";
import { useOpenStatusMessage } from "@/components/dealership/OpenStatusBadge";
import { getOpenStatus } from "@/lib/utils/open-status";
import { cairoNow } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";

/** Indexed by `Date.getUTCDay()`, so Sunday first. */
const DAY_KEYS: readonly DayOfWeek[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];

/** The week's opening hours as a table, today's row in bold, the open status above. */
export const DealershipWorkingHours = ({
    workingHours,
    className,
}: {
    workingHours?: WorkingHoursEntry[] | null;
    className?: string;
}) => {
    const t = useTranslations("dealerships");
    const describe = useOpenStatusMessage();

    // Which row is today is a Cairo question, like the open/closed status: a
    // reader an hour behind should not see yesterday's row marked "today".
    const currentDayKey = useMemo(() => {
        const [year, month, day] = cairoNow().date.split("-").map(Number);
        return DAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    }, []);
    const status = useMemo(() => getOpenStatus(workingHours), [workingHours]);

    if (!workingHours || workingHours.length === 0) return null;

    return (
        <section className={className}>
            <h2 className="mb-1 text-h3 font-semibold">{t("detail.about.hours")}</h2>
            <p className={cn("mb-3 text-caption font-semibold", status.isOpen ? "text-positive" : "text-destructive")}>
                {status.isOpen ? t("openStatus.openNow") : t("openStatus.closed")}
                {status.statusKey !== "closed" && status.statusKey !== "unavailable" && (
                    <span className="font-normal text-muted-foreground"> · {describe(status)}</span>
                )}
            </p>
            <table className="w-full text-body">
                <tbody>
                    {workingHours.map((wh) => {
                        const isToday = wh.dayKey === currentDayKey;
                        return (
                            <tr key={wh.dayKey} className={cn("border-b border-border last:border-0", isToday && "font-semibold")}>
                                <th scope="row" className="py-2.5 text-start font-[inherit]">
                                    {t(`days.${wh.dayKey}`)}
                                    {isToday && <span className="text-muted-foreground"> · {t("workingHours.today")}</span>}
                                </th>
                                <td className={cn("py-2.5 text-end", !wh.isOpen && "text-muted-foreground")}>
                                    {wh.isOpen ? <TimeRange start={wh.openTime} end={wh.closeTime} /> : t("workingHours.closed")}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </section>
    );
};
