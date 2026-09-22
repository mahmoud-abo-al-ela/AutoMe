"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";

const TestDriveButton = ({
    car,
    testDriveId,
    isCheckingTestDrive,
    isScheduleLoading,
    onScheduleTestDrive,
    onViewTestDrive,
}: {
    car: CarDetail;
    testDriveId: string | null;
    isCheckingTestDrive: boolean;
    isScheduleLoading: boolean;
    onScheduleTestDrive: () => void;
    onViewTestDrive: () => void;
}) => {
  const t = useTranslations("carDetail.testDrive");
    // If car is not available
    if (car.status !== "AVAILABLE") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Button
                                variant="outline"
                                disabled
                                className="w-full py-3 sm:py-4 rounded-xl cursor-not-allowed opacity-60"
                            >
                                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                                {t("schedule")}
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("unavailable")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // If checking for existing test drive
    if (isCheckingTestDrive) {
        return (
            <Button
                variant="outline"
                disabled
                className="w-full py-3 sm:py-4 rounded-xl"
            >
                <div className="w-4 h-4 border-2 border-t-2 border-blue-500 border-t-transparent rounded-full animate-spin me-2"></div>
                {t("checking")}
            </Button>
        );
    }

    // If user has already scheduled a test drive
    if (testDriveId) {
        return (
            <Button
                variant="outline"
                onClick={onViewTestDrive}
                className="w-full py-3 sm:py-4 rounded-xl hover:scale-105 transition-transform cursor-pointer bg-blue-50 border-blue-200 text-blue-700"
            >
                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                {t("viewYours")}
            </Button>
        );
    }

    // Default case: Schedule a test drive
    return (
        <Button
            variant="outline"
            onClick={onScheduleTestDrive}
            disabled={isScheduleLoading}
            className="w-full py-3 sm:py-4 rounded-xl hover:scale-105 transition-transform cursor-pointer"
        >
            {isScheduleLoading ? (
                <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-t-2 border-blue-500 border-t-transparent rounded-full animate-spin me-2"></div>
                    {t("processing")}
                </div>
            ) : (
                <>
                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                    {t("schedule")}
                </>
            )}
        </Button>
    );
};

export default TestDriveButton;