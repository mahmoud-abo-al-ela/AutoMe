"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getDrivesNeedingOutcome, getScheduleDay, getScheduleMonth } from "@/actions/dashboard";
import { updateTestDriveStatus } from "@/actions/test-drive";
import { queryKeys } from "@/lib/query-client";
import { useActionError } from "@/hooks/use-action-error";
import { cairoNow } from "@/lib/utils/datetime";
import type { ActionError } from "@/lib/utils/error-messages";
import type { ActionResponse } from "@/lib/utils/response";

function unwrap<T>(response: ActionResponse<T>): T {
  if (!response.success) throw response.error;
  return response.data;
}

/** Under testDrives, so a change made anywhere (Requests, this page) refreshes all of it. */
const scheduleKeys = {
  month: (month: string) => [...queryKeys.testDrives.all, "schedule", "month", month],
  day: (date: string) => [...queryKeys.testDrives.all, "schedule", "day", date],
  outcomes: () => [...queryKeys.testDrives.all, "schedule", "outcomes"],
};

/** What a status change means to the dealer, for its toast. */
export type DriveChange =
  | { status: "CONFIRMED"; toast: "CONFIRMED" }
  | { status: "COMPLETED"; toast: "COMPLETED" }
  | { status: "CANCELLED"; toast: "declined" | "cancelled" | "noShow" };

/**
 * The Test drives calendar (canvas: calendar round 2, C · Month and day): the
 * month shown, the day chosen (kept in the address, so a refresh or a shared
 * link opens the same day), that day's drives and free time, and every drive
 * still needing an outcome. Cairo's clock ticks here each minute, so "now"
 * and which drives are over stay right while the page is open.
 */
export function useSchedule(initialDate: string) {
  const t = useTranslations("org.testDrives.toasts");
  const actionError = useActionError();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState(initialDate);
  const [viewMonth, setViewMonth] = useState(initialDate.slice(0, 7));
  const [now, setNow] = useState(() => cairoNow());

  useEffect(() => {
    const timer = setInterval(() => setNow(cairoNow()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const month = useQuery({
    queryKey: scheduleKeys.month(viewMonth),
    queryFn: async () => unwrap(await getScheduleMonth({ month: viewMonth })),
    placeholderData: keepPreviousData,
  });
  const day = useQuery({
    queryKey: scheduleKeys.day(selected),
    queryFn: async () => unwrap(await getScheduleDay({ date: selected })),
    placeholderData: keepPreviousData,
  });
  const outcomes = useQuery({
    queryKey: scheduleKeys.outcomes(),
    queryFn: async () => unwrap(await getDrivesNeedingOutcome()),
  });

  const change = useMutation({
    mutationFn: async ({ id, change }: { id: string; change: DriveChange }) =>
      unwrap(await updateTestDriveStatus({ testDriveId: id, status: change.status })),
    onSuccess: (_data, { change }) => toast.success(t(change.toast)),
    onError: (error: unknown) => toast.error(actionError(error as ActionError, t("failed"))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.testDrives.all }),
  });

  const select = (date: string) => {
    setSelected(date);
    setViewMonth(date.slice(0, 7));
    // The address follows the day, without a trip to the server.
    window.history.replaceState(null, "", `?date=${date}`);
  };

  /** Move the month shown by `delta` months, leaving the chosen day as it is. */
  const shiftMonth = (delta: number) => {
    const [year, monthIndex] = viewMonth.split("-").map(Number);
    const next = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
    setViewMonth(next.toISOString().slice(0, 7));
  };

  return {
    selected,
    viewMonth,
    now,
    month,
    day,
    outcomes,
    pendingId: change.isPending ? change.variables?.id ?? null : null,
    handlers: {
      select,
      shiftMonth,
      goToToday: () => select(now.date),
      change: (id: string, next: DriveChange) => change.mutateAsync({ id, change: next }).catch(() => undefined),
    },
  };
}

export type ScheduleState = ReturnType<typeof useSchedule>;
