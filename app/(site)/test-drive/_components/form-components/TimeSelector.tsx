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

const TimeSelector = ({
    label,
    placeholder = "Select time",
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
    return (
        <div>
            <Label className="block mb-2 font-medium">{label}</Label>
            <Select
                disabled={disabled}
                onValueChange={onTimeSelect}
                defaultValue={defaultValue}
            >
                <SelectTrigger className={cn(error && "border-red-500")}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                            {time}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
        </div>
    );
};

export default TimeSelector;
