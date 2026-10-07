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
import type { InventoryRow } from "@/lib/services/dashboard";
import { useCarName } from "./ledger-shared";

/**
 * Deleting a car is the one change on this page that cannot be undone, so it
 * asks first, naming the car, with the destructive verb on the button. Radix
 * puts focus on "Keep it" when it opens; Escape closes it without deleting.
 */
export function DeleteCarDialog({
  car,
  onClose,
  onDelete,
}: {
  car: InventoryRow | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const t = useTranslations("org.cars.ledger.delete");
  const carName = useCarName();

  return (
    <AlertDialog open={!!car} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        {car && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.rich("title", { name: carName(car), car: (chunks) => <bdi>{chunks}</bdi> })}
              </AlertDialogTitle>
              <AlertDialogDescription>{t("body")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={async () => {
                  try {
                    await onDelete(car.id);
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
