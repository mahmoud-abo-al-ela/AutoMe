"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ScheduleDrive } from "@/lib/services/dashboard/schedule";
import type { DriveChange } from "@/hooks/use-schedule";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { useDriveText } from "./schedule-shared";

/**
 * Confirmed drives whose time has passed with nothing recorded — the one
 * thing on this page waiting on the dealer, so it sits in amber under the
 * calendar. "Happened" counts the drive in Insights; "Didn't come" records the
 * no-show without telling the buyer anything.
 */
export function OutcomeList({
  drives,
  pendingId,
  onChange,
  onOpenDay,
}: {
  drives: ScheduleDrive[];
  pendingId: string | null;
  onChange: (id: string, change: DriveChange) => void;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations("org.testDrives.outcome");
  const text = useDriveText();
  const fmt = useFormatters();
  // On a phone the list starts folded to one line, so the day stays near the top.
  const [open, setOpen] = useState(false);
  if (drives.length === 0) return null;

  return (
    <section aria-labelledby="outcome-title" className="rounded-sheet border border-[#e8d48a] bg-[#fff8dd] p-4">
      <h2 id="outcome-title" className="text-body font-semibold">
        {t("title")}
      </h2>
      <p className="text-caption text-[#5c4a1a] max-lg:hidden">{t("body")}</p>
      <p className="text-caption font-semibold text-[#8a5e00] lg:hidden">{t("count", { count: drives.length, value: fmt.number(drives.length) })}</p>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mt-1 h-9 cursor-pointer text-caption font-semibold text-[#1d4e9e] hover:underline lg:hidden">
        {open ? t("hide") : t("show")}
      </button>
      <ul className={cn("mt-3 flex flex-col gap-2.5", !open && "max-lg:hidden")}>
        {drives.map((drive) => {
          const busy = pendingId === drive.id;
          return (
            <li key={drive.id} aria-busy={busy || undefined} className={cn("rounded-control border border-border bg-field p-3", busy && "opacity-60")}>
              <p className="text-body font-semibold">{text.buyer(drive)}</p>
              <button
                type="button"
                onClick={() => onOpenDay(drive.date)}
                className="block cursor-pointer text-start text-caption text-muted-foreground hover:text-foreground hover:underline"
              >
                <bdi>{text.car(drive)}</bdi>, {t("when", { day: text.day(drive.date), time: text.time(drive.startTime) })}
              </button>
              <div className="mt-2.5 flex gap-2">
                <Button variant="inverse" size="control" className="h-10 flex-1" disabled={busy} onClick={() => onChange(drive.id, { status: "COMPLETED", toast: "COMPLETED" })}>
                  {t("happened")}
                </Button>
                <Button variant="outline-strong" size="control" className="h-10 flex-1 border bg-field" disabled={busy} onClick={() => onChange(drive.id, { status: "CANCELLED", toast: "noShow" })}>
                  {t("didntCome")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
