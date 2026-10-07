"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSchedule } from "@/hooks/use-schedule";
import type { ScheduleDrive } from "@/lib/services/dashboard/schedule";
import { OrgPageHeader } from "../../_components/OrgPageHeader";
import { MonthCalendar } from "./MonthCalendar";
import { OutcomeList } from "./OutcomeList";
import { DaySchedule } from "./DaySchedule";
import { CancelDriveDialog } from "./CancelDriveDialog";

/**
 * Test drives (canvas: Test drives — calendar round 2, C · Month and day):
 * the month on the side with the drives that need an outcome beneath it, and
 * the chosen day — its drives and the free time between them — beside it.
 * On a phone: the week (or the month, on request), the outcomes, then the day.
 */
export function TestDrivesView({ initialDate, base }: { initialDate: string; base: string }) {
  const t = useTranslations("org.testDrives");
  const state = useSchedule(initialDate);
  const [cancelling, setCancelling] = useState<{ drive: ScheduleDrive; kind: "decline" | "cancel" } | null>(null);
  const month = state.month.data;
  const day = state.day.data;

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader title={t("title")} description={t("subtitle")} className="mb-0 md:mb-0" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          {month ? (
            <MonthCalendar
              month={state.viewMonth}
              selected={state.selected}
              today={month.today}
              days={month.days}
              closedWeekdays={month.closedWeekdays}
              onSelect={state.handlers.select}
              onShift={state.handlers.shiftMonth}
            />
          ) : (
            <span aria-busy className="skeleton-shimmer h-[22rem] rounded-sheet max-lg:h-36" />
          )}
          <OutcomeList
            drives={state.outcomes.data ?? []}
            pendingId={state.pendingId}
            onChange={state.handlers.change}
            onOpenDay={state.handlers.select}
          />
        </div>

        {state.day.isError && !day ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-sheet border border-border bg-card p-6">
            <p className="text-body">{t("loadFailed")}</p>
            <Button variant="outline-strong" size="control" onClick={() => state.day.refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : day ? (
          <div className={state.day.isFetching && day.date !== state.selected ? "opacity-60 transition-opacity" : undefined}>
            <DaySchedule
              day={day}
              now={state.now}
              base={base}
              pendingId={state.pendingId}
              onChange={state.handlers.change}
              onAskCancel={(drive, kind) => setCancelling({ drive, kind })}
            />
          </div>
        ) : (
          <div aria-busy className="flex flex-col gap-3 rounded-sheet border border-border bg-card p-6">
            <span className="skeleton-shimmer h-8 w-2/3 rounded" />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="skeleton-shimmer h-16 rounded-control" />
            ))}
          </div>
        )}
      </div>

      <CancelDriveDialog
        target={cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={(drive, kind) =>
          state.handlers.change(drive.id, { status: "CANCELLED", toast: kind === "decline" ? "declined" : "cancelled" })
        }
      />
    </div>
  );
}
