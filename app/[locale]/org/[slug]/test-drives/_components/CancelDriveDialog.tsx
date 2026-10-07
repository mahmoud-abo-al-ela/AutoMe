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
import type { ScheduleDrive } from "@/lib/services/dashboard/schedule";
import { useDriveText } from "./schedule-shared";

/**
 * Declining a request or cancelling a confirmed drive emails the buyer and
 * frees the slot, so it asks first: the buyer by name, the car and the time,
 * and the destructive verb on the button. Focus starts on "Keep it".
 */
export function CancelDriveDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: { drive: ScheduleDrive; kind: "decline" | "cancel" } | null;
  onClose: () => void;
  onConfirm: (drive: ScheduleDrive, kind: "decline" | "cancel") => void;
}) {
  const t = useTranslations("org.testDrives.cancelDialog");
  const text = useDriveText();

  return (
    <AlertDialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        {target && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.rich(target.kind === "decline" ? "titleDecline" : "titleCancel", {
                  name: text.buyer(target.drive),
                  buyer: (chunks) => <bdi>{chunks}</bdi>,
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("body", { car: text.car(target.drive), day: text.day(target.drive.date), time: text.time(target.drive.startTime) })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => {
                  onConfirm(target.drive, target.kind);
                  onClose();
                }}
              >
                {target.kind === "decline" ? t("decline") : t("cancel")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
