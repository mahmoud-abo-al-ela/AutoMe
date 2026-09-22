"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { TimeRange } from "@/components/common/TimeRange";
import { useOpenStatusMessage } from "./OpenStatusBadge";
import { getOpenStatus } from "@/lib/utils/open-status";
import { cairoNow } from "@/lib/utils/datetime";
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

export const DealershipWorkingHours = ({
    workingHours,
}: {
    workingHours?: WorkingHoursEntry[] | null;
}) => {
    const t = useTranslations("dealerships");
    const describe = useOpenStatusMessage();

    // Which row to highlight is a Cairo question, like the open/closed status:
    // a reader an hour behind should not see yesterday's row marked "today".
    const currentDayKey = useMemo(() => {
        const [year, month, day] = cairoNow().date.split("-").map(Number);
        return DAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    }, []);

    const openStatus = useMemo(
        () => getOpenStatus(workingHours),
        [workingHours]
    );

    if (!workingHours || workingHours.length === 0) {
        return null;
    }

    return (
        <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-6">
                {/* Header with open/closed status */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-500" />
                        {t("workingHours.title")}
                    </h3>
                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${openStatus.isOpen
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${openStatus.isOpen
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-red-500"
                                }`}
                        />
                        {openStatus.isOpen
                            ? t("openStatus.openNow")
                            : t("openStatus.closed")}
                        {openStatus.statusKey !== "closed" && (
                            <span className="opacity-70">
                                · {describe(openStatus)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Working hours list */}
                <div className="space-y-1">
                    {workingHours.map((wh) => {
                        const isToday = wh.dayKey === currentDayKey;

                        return (
                            <div
                                key={wh.dayKey}
                                className={`flex justify-between items-center text-sm px-3 py-2.5 rounded-lg transition-colors ${isToday
                                        ? "bg-primary/5 border border-primary/10 font-medium"
                                        : "hover:bg-slate-50"
                                    }`}
                            >
                                <span
                                    className={`flex items-center gap-2 ${isToday
                                            ? "text-primary font-semibold"
                                            : "font-medium text-slate-700"
                                        }`}
                                >
                                    {isToday && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                    {t(`days.${wh.dayKey}`)}
                                    {isToday && (
                                        <span className="text-micro uppercase tracking-wider text-primary/70 font-semibold">
                                            {t("workingHours.today")}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={
                                        wh.isOpen
                                            ? isToday
                                                ? "text-primary font-semibold"
                                                : "text-green-600"
                                            : "text-red-500"
                                    }
                                >
                                    {wh.isOpen ? (
                                        <TimeRange
                                            start={wh.openTime}
                                            end={wh.closeTime}
                                        />
                                    ) : (
                                        t("workingHours.closed")
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
