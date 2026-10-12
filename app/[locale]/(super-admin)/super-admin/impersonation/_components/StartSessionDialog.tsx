"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { inputClass } from "@/components/dashboard/form-ui";
import type { SessionsPage } from "@/lib/services/super-admin/sessions";

type Dealership = SessionsPage["dealerships"][number];

/** Starting a support session: choose the dealership, then who and why in the usual dialog. */
export function StartSessionDialog({
  open,
  onOpenChange,
  dealerships,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerships: Dealership[];
  onChoose: (dealership: Dealership) => void;
}) {
  const t = useTranslations("superAdmin.impersonation");
  const [dealership, setDealership] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("startDialog.title")}</DialogTitle>
          <DialogDescription>{t("startDialog.body")}</DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-semibold">{t("startDialog.dealership")}</span>
          <SearchableLocationSelect
            value={dealership}
            options={dealerships.map((d) => ({ value: d.id, label: d.name }))}
            placeholder={t("startDialog.choose")}
            searchPlaceholder={t("startDialog.search")}
            emptyMessage={t("startDialog.none")}
            onValueChange={setDealership}
            triggerClassName={inputClass()}
          />
        </label>
        <DialogFooter>
          <Button
            variant="marker"
            size="control"
            className="h-11"
            disabled={!dealership}
            onClick={() => {
              const chosen = dealerships.find((d) => d.id === dealership);
              if (!chosen) return;
              onChoose(chosen);
            }}
          >
            {t("startDialog.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
