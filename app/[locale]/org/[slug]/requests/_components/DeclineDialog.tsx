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
