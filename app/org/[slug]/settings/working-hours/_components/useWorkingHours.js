import { useState, useEffect } from "react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { getDealershipInfo, updateWorkingHours } from "@/actions/settings";

const DAYS = [
    { label: "Monday", value: "MONDAY" },
    { label: "Tuesday", value: "TUESDAY" },
    { label: "Wednesday", value: "WEDNESDAY" },
    { label: "Thursday", value: "THURSDAY" },
    { label: "Friday", value: "FRIDAY" },
    { label: "Saturday", value: "SATURDAY" },
    { label: "Sunday", value: "SUNDAY" },
];

const DEFAULT_WORKING_HOURS = DAYS.reduce((acc, day) => {
    acc[day.value] = {
        dayOfWeek: day.value,
        openTime: "09:00",
        closeTime: "18:00",
        isOpen: day.value !== "SUNDAY",
    };
    return acc;
}, {});

export function useWorkingHours() {
    const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);

    const {
        data: dealershipData,
        loading: loadingDealershipData,
        error: dealershipError,
        fn: fetchDealershipData,
    } = useFetch(getDealershipInfo, true);

    const {
        data: updateWorkingHoursData,
        loading: loadingUpdateWorkingHours,
        error: updateWorkingHoursError,
        fn: updateWorkingHoursFn,
    } = useFetch(updateWorkingHours);

    useEffect(() => {
        fetchDealershipData();
    }, []);

    useEffect(() => {
        if (dealershipData?.data?.workingHours && dealershipData.data.workingHours.length > 0) {
            const formattedHours = {};

            dealershipData.data.workingHours.forEach((hour) => {
                const day = Array.isArray(hour.dayOfWeek)
                    ? hour.dayOfWeek[0]
                    : hour.dayOfWeek;

                if (day) {
                    formattedHours[day] = {
                        dayOfWeek: day,
                        openTime: hour.openTime || "09:00",
                        closeTime: hour.closeTime || "18:00",
                        isOpen: hour.isOpen ?? false,
                    };
                }
            });

            if (Object.keys(formattedHours).length > 0) {
                setWorkingHours(formattedHours);
            }
        }
    }, [dealershipData]);

    const handleDayToggle = (day, isOpen) => {
        setWorkingHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], isOpen },
        }));
    };

    const handleTimeChange = (day, type, value) => {
        setWorkingHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], [type]: value },
        }));
    };

    const handleSave = async () => {
        const hoursArray = Object.values(workingHours)
            .filter((hour) => hour.dayOfWeek)
            .map((hour) => ({
                dayOfWeek: Array.isArray(hour.dayOfWeek) ? hour.dayOfWeek : [hour.dayOfWeek],
                openTime: hour.openTime || "09:00",
                closeTime: hour.closeTime || "18:00",
                isOpen: hour.isOpen ?? false,
            }));

        if (hoursArray.length !== 7) {
            toast.error("Please configure all days of the week");
            return;
        }

        try {
            const response = await updateWorkingHoursFn(hoursArray);
            if (response.success) {
                toast.success("Working hours updated successfully");
            }
        } catch (error) {
            toast.error("Failed to update working hours");
        }
    };

    return {
        workingHours,
        loadingDealershipData,
        loadingUpdateWorkingHours,
        handleDayToggle,
        handleTimeChange,
        handleSave,
    };
}
