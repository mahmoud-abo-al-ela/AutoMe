"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";

/** Book / view a test drive — the secondary action under "Message dealer". */
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

  if (car.status !== "AVAILABLE") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A disabled button swallows pointer events; the span carries the tooltip. */}
            <span tabIndex={0} className="block rounded-control">
              <Button variant="outline-strong" size="xl" disabled className="w-full">
                <CalendarDays />
                {t("schedule")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("unavailable")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isCheckingTestDrive) {
    return (
      <Button variant="outline-strong" size="xl" disabled className="w-full">
        <Loader2 className="motion-safe:animate-spin" />
        {t("checking")}
      </Button>
    );
  }

  if (testDriveId) {
    return (
      <Button variant="outline-strong" size="xl" onClick={onViewTestDrive} className="w-full bg-positive-soft">
        <CalendarDays />
        {t("viewYours")}
      </Button>
    );
  }

  return (
    <Button variant="outline-strong" size="xl" onClick={onScheduleTestDrive} disabled={isScheduleLoading} className="w-full">
      {isScheduleLoading ? <Loader2 className="motion-safe:animate-spin" /> : <CalendarDays />}
      {isScheduleLoading ? t("processing") : t("schedule")}
    </Button>
  );
};

export default TestDriveButton;
