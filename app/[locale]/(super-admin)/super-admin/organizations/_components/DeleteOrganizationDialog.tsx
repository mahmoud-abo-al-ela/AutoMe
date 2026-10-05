"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type { OrganizationRowData } from "./OrganizationsTable";

export default function DeleteOrganizationDialog({
  open,
  org,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  org: OrganizationRowData | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
}) {
  const t = useTranslations("superAdmin.organizations.delete");
  const tCommon = useTranslations("superAdmin.common");
  const tActions = useTranslations("common.actions");
  const { number } = useFormatters();

  const cars = org?._count?.cars ?? 0;
  const members = org?._count?.memberships ?? 0;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isDeleting && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("title")}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                {t.rich("confirm", {
                  name: org?.name ?? "",
                  strong: (chunks) => (
                    <span className="font-semibold">{chunks}</span>
                  ),
                })}
              </p>
              {(cars > 0 || members > 0) && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>{tCommon("warning")}</strong>{" "}
                  {t("dataWarning", {
                    cars: t("cars", { count: cars, value: number(cars) }),
                    members: t("members", {
                      count: members,
                      value: number(members),
                    }),
                  })}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {tActions("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon("deleting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
