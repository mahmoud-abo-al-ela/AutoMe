"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareUtils } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Fixed tray that surfaces the compare selection (max 3, stored in
 * localStorage) from anywhere on /cars and links through to /compare. Syncs
 * via the same `compareListUpdated` event CarCard already dispatches.
 *
 * Asphalt, like the toasts, and lifted clear of the phone tab bar.
 */
export const CompareTray = () => {
  const t = useTranslations("cars.compare");
  const fmt = useFormatters();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(compareUtils.getCompareList());
    sync();
    window.addEventListener("compareListUpdated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("compareListUpdated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (ids.length === 0) return null;

  const clear = () => {
    compareUtils.clearCompareList();
    window.dispatchEvent(new Event("compareListUpdated"));
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6">
      <div
        role="region"
        aria-label={t("action")}
        className="flex w-full max-w-md items-center gap-3 rounded-control bg-inverse py-2.5 ps-4 pe-2 text-inverse-foreground shadow-float"
      >
        <Scale aria-hidden className="size-5 shrink-0 text-marker" />
        <p className="flex min-w-0 flex-col text-caption font-semibold leading-tight">
          {t("selected", { count: ids.length, value: fmt.number(ids.length) })}
          <span className="text-micro font-normal text-inverse-foreground/70">
            {ids.length < 2 ? t("needTwo") : t("remaining", { value: fmt.number(3 - ids.length) })}
          </span>
        </p>
        <div className="ms-auto flex items-center gap-1">
          {ids.length < 2 ? (
            <Button variant="marker" size="control" disabled>
              {t("action")}
            </Button>
          ) : (
            <Button variant="marker" size="control" asChild>
              <Link href="/compare">{t("action")}</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={clear}
            aria-label={t("clear")}
            title={t("clear")}
            className="flex size-10 items-center justify-center rounded-control text-inverse-foreground/70 transition-colors hover:bg-inverse-hover hover:text-inverse-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareTray;
