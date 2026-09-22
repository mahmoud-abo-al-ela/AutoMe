"use client";

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

const TimeSelector = ({
    label,
    placeholder,
    timeSlots,
    onTimeSelect,
    disabled,
    error,
    defaultValue,
}: {
    label: string;
    placeholder?: string;
    timeSlots: string[];
    onTimeSelect: (time: string) => void;
    disabled: boolean;
    error?: string;
    defaultValue?: string;
}) => {
    const t = useTranslations("testDrive.form");
    const { clockTime } = useFormatters();

    return (
        <div>
            <Label className="block mb-2 font-medium">{label}</Label>
            <Select
                disabled={disabled}
                onValueChange={onTimeSelect}
                defaultValue={defaultValue}
            >
                <SelectTrigger className={cn(error && "border-red-500")}>
                    <SelectValue placeholder={placeholder ?? t("selectTime")} />
                </SelectTrigger>
                <SelectContent>
                    {timeSlots.map((time) => (
                        // The value stays the raw "HH:mm" the form and the
                        // server expect; only the label is localized.
                        <SelectItem key={time} value={time}>
                            <span dir="auto">{clockTime(time)}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
        </div>
    );
};

export default TimeSelector;
