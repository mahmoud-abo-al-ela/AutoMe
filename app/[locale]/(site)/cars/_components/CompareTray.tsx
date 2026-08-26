"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareUtils } from "@/lib/utils";

/**
 * Fixed tray that surfaces the compare selection (max 3, stored in
 * localStorage) from anywhere on /cars and links through to /compare. Syncs
 * via the same `compareListUpdated` event CarCard already dispatches.
 */
export const CompareTray = () => {
  const t = useTranslations("cars.compare");
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
    <div className="safe-area-inset-bottom fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4 text-primary" />
          <span>
            {t("selected", { count: ids.length })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("remaining", { count: 3 - ids.length })}
          </span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          {ids.length < 2 ? (
            <Button size="sm" disabled title={t("needTwo")}>
              {t("action")}
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/compare">{t("action")}</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={clear}
            aria-label={t("clear")}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareTray;
