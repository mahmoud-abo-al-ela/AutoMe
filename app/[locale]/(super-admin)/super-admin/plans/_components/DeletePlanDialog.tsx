"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanWithUsage } from "./PlansGrid";

export default function DeletePlanDialog({
  open,
  plan,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  plan: PlanWithUsage | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const t = useTranslations("superAdmin.plans.delete");
  const tCommon = useTranslations("superAdmin.common");
  const tActions = useTranslations("common.actions");
  const { number } = useFormatters();
  const active = plan?.activeSubscriptions ?? 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("title", { name: plan?.name ?? "" })}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                {t.rich("body", {
                  name: plan?.name ?? "",
                  strong: (chunks) => (
                    <span className="font-semibold">{chunks}</span>
                  ),
                })}
              </p>
              {active > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>{tCommon("warning")}</strong>{" "}
                  {t("activeWarning", {
                    count: t("activeCount", { count: active, value: number(active) }),
                  })}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {tActions("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading || active > 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon("deleting")}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 me-2" />
                {t("submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
