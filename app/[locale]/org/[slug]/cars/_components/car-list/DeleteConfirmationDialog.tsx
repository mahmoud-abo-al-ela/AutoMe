"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { AdminCarRow } from "./CarsListPresenter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Trash2 } from "lucide-react";

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  car,
  onDelete,
  isDeleting,
}: {
  isOpen: boolean;
  /** Receives the Dialog's open state, so this is the setter itself. */
  onClose: (open: boolean) => void;
  /** null while no row is queued for deletion. */
  car: AdminCarRow | null;
  /** Takes the id of the car to delete. */
  onDelete: (carId: string) => void | Promise<void>;
  isDeleting: boolean;
}) => {
  const t = useTranslations("org.cars.deleteDialog");
  const tCommon = useTranslations("common.actions");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-4 sm:p-6 max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm sm:text-base">
            {t.rich("body", {
              title: car?.title ?? "",
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 flex-col sm:flex-row mt-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto order-2 sm:order-1 cursor-pointer"
          >
            {tCommon("cancel")}
          </Button>
          {/* The dialog only opens with a car queued, so the guard below is
              unreachable; before, a null car called onDelete(undefined). */}
          <Button
            variant="destructive"
            onClick={() => car && onDelete(car.id)}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2 cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />
                {t("deleting")}
              </>
            ) : (
              <>
                <Trash2 className="me-2 h-4 w-4" />
                {t("title")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
