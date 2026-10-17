"use client";

import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    dayPeriodLabels,
    dayPeriodOf,
    flipDayPeriod,
} from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";

export default function TimeInput({
    id,
    value,
    onChange,
    onBlur,
    name,
    disabled,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    name?: string;
    disabled?: boolean;
    className?: string;
}) {
    const t = useTranslations("common.time");
    const locale = useLocale() as Locale;
    const localized = locale === "ar";

    const period = dayPeriodOf(value);
    const labels = dayPeriodLabels(locale);

    return (
        <span className="relative inline-flex items-center">
            <Input
                id={id}
                name={name}
                type="time"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                disabled={disabled}
                className={cn(
                    localized && "time-input-localized pl-9",
                    className
                )}
            />

            {localized && period && (
                <button
                    type="button"
                    // The native marker this replaces is a field the reader can
                    // change, so this has to be one too — a label alone would
                    // take away the only way to say "morning".
                    onClick={() => onChange(flipDayPeriod(value))}
                    disabled={disabled}
                    aria-label={t("togglePeriod")}
                    className={cn(
                        "time-period-chip absolute left-2 top-1/2 -translate-y-1/2",
                        "cursor-pointer items-center rounded px-1 text-base",
                        "font-medium text-gray-600 transition-colors",
                        "hover:bg-gray-100 hover:text-gray-900",
                        "disabled:pointer-events-none disabled:opacity-50"
                    )}
                >
                    {labels[period]}
                </button>
            )}
        </span>
    );
}
