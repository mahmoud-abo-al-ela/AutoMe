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

/**
 * A native time input whose AM/PM reads in the page's language.
 *
 * The input formats its own value, and it does so from the *browser's* UI
 * language — not the page's. `lang="ar"`, `lang="ar-EG"` and
 * `lang="ar-EG-u-nu-latn"` on the element were all tried; Chromium renders
 * "04:00 PM" for every one of them. So in Arabic the native marker is hidden
 * (see app/globals.css) and replaced by the chip below, which carries the same
 * ص/م that Intl gives every other time in the product.
 *
 * Everything else stays the browser's: the digits, the field's own keyboard
 * handling, and the picker behind the clock icon. Only the marker is ours, and
 * only in Arabic — the English input is untouched.
 */
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

    // Physical `left`, not `start`: a time input lays its own contents out
    // left-to-right whatever the page direction — digits at the left edge,
    // picker icon at the right — so the marker goes at the physical left and
    // the digits are padded off it. Hiding the native marker frees space
    // inside the field but nothing reflows to fill it, which is why the
    // padding is added rather than inherited.
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
