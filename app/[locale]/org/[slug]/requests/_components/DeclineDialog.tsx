"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarName, type DriveRequest } from "./RequestRows";

/**
 * Declining cancels a buyer's booking and tells them so — it is not undone
 * from here, so it asks first, naming the buyer, the car and the slot, with a
 * destructive verb on the button. Radix puts focus on Cancel ("Keep it")
 * when it opens, and Escape closes it without declining.
 */
export function DeclineDialog({
  drive,
  onClose,
  onDecline,
}: {
  drive: DriveRequest | null;
  onClose: () => void;
  onDecline: (id: string) => Promise<unknown>;
}) {
  const t = useTranslations("org.requests.decline");
  const tDrive = useTranslations("org.requests.drive");
  const fmt = useFormatters();
  const carName = useCarName();
  const buyer = drive?.user?.name?.trim() || tDrive("anonymousBuyer");

  return (
    <AlertDialog open={!!drive} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        {drive && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("title", { buyer })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("body", {
                  car: carName(drive.car),
                  day: fmt.date(drive.date, { weekday: "long", day: "numeric", month: "long", year: undefined, timeZone: "UTC" }),
                  time: fmt.clockTime(drive.startTime),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={async () => {
                  try {
                    await onDecline(drive.id);
                  } finally {
                    onClose();
                  }
                }}
              >
                {t("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
