"use client";

import { useTranslations } from "next-intl";
import { Minus, X } from "lucide-react";
import type { CarDetail } from "@/app/[locale]/(site)/cars/[id]/_lib/car-detail-types";
import { CarContactActions } from "../CarContactActions";
import { ChatCarSummary } from "../ChatCarSummary";

const ICON_BUTTON =
  "cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * The top of the floating chat: the car as it is now (live price and status,
 * not the snapshot taken when the conversation started), who is selling it,
 * and the ways to reach them outside the chat — as marketplace apps pin the
 * listing above every conversation.
 */
export function DockHeader({
  car,
  onCarPage,
  onMinimize,
  onClose,
}: {
  car: CarDetail;
  /** Already on this car's page: "View car" would go nowhere. */
  onCarPage: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("chat.dock");

  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex items-start gap-3 px-3 pt-3">
        <ChatCarSummary car={car} subtitle={car.organization?.name} />
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={onMinimize} className={ICON_BUTTON} aria-label={t("minimize")}>
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className={ICON_BUTTON} aria-label={t("close")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <CarContactActions car={car} audience="buyer" showViewCar={!onCarPage} className="px-3 py-2" />
    </div>
  );
}
