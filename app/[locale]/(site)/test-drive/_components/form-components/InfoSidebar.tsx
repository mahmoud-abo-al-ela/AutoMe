"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Static booking guidance. This used to take `car`/`carId` props and fetch
 * `/api/cars/${carId}` — a route that does not exist, so the request 404'd and
 * react-query retried it on every render of the create form. The result was
 * never rendered either: the panel below is entirely static.
 */
/** Kept in step with the same figure in TestDriveStatusMessage. */
const ARRIVE_EARLY_MINUTES = 10;
const CONFIRMATION_WINDOW_HOURS = 24;

const InfoSidebar = () => {
  const t = useTranslations("testDrive.sidebar");
  const fmt = useFormatters();

  return (
    <Card className="p-4 md:p-6 mx-2 md:mx-0 gap-3">
      <h3 className="text-lg font-semibold mb-2 md:mb-4">{t("title")}</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 me-2 mt-0.5">
            <CalendarDays className="h-6 w-6" />
          </span>
          <span>{t("availability")}</span>
        </li>
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 me-2 mt-0.5">
            <Clock className="h-6 w-6" />
          </span>
          <span>
            {t("arriveEarly", { minutes: fmt.number(ARRIVE_EARLY_MINUTES) })}
          </span>
        </li>
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 me-2 mt-0.5">
            <Info className="h-6 w-6" />
          </span>
          <span>{t("bringDocuments")}</span>
        </li>
      </ul>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">
        <p>
          {t("confirmation", {
            hours: fmt.number(CONFIRMATION_WINDOW_HOURS),
          })}
        </p>
      </div>
    </Card>
  );
};

export default InfoSidebar;
