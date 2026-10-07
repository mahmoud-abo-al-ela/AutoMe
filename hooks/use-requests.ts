"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getTestDrives, updateTestDriveStatus } from "@/actions/test-drive";
import { answerBuyerQuestion, getBuyerQuestions, setBuyerQuestionStatus } from "@/actions/buyer-questions";
import { queryKeys } from "@/lib/query-client";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import type { ActionResponse } from "@/lib/utils/response";

export type RequestsView = "all" | "drives" | "questions";

/**
 * A pending test drive as the list action returns it. serializeTestDrive is
 * typed loosely (a nullable row, the car as a plain record), so the fields
 * this inbox reads are named here; findManyTestDrives selects every one.
 */
export type DriveRequest = {
  id: string;
  organizationId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  car: { id: string; make: string; model: string; year: number; title?: string | null } | null;
  user: { name?: string | null } | null;
};

/** How many rows a section shows per page; "all" shows the first page of each. */
const DRIVES_PER_PAGE = 10;

function unwrap<T>(response: ActionResponse<T>): T {
  if (!response.success) throw response.error;
  return response.data;
}

/**
 * The dealer's Requests inbox (canvas: Round 3 — Requests): what buyers are
 * waiting on — test drives to confirm and buyer questions to answer — acted
 * on in place. Built on the same actions as the Test drives and Buyer
 * questions pages, and invalidating their caches too, so a confirmation here
 * shows there at once and the other way round.
 */
export function useRequests() {
  const t = useTranslations("org.requests.toasts");
  const actionError = useActionError();
  const queryClient = useQueryClient();
  const [view, setView] = useState<RequestsView>("all");
  const [drivesPage, setDrivesPage] = useState(1);
  const [questionsPage, setQuestionsPage] = useState(1);

  const driveParams = { status: "PENDING", page: drivesPage, limit: DRIVES_PER_PAGE };
  const drivesQuery = useQuery({
    queryKey: queryKeys.testDrives.list(driveParams),
    queryFn: () => getTestDrives(driveParams),
    placeholderData: keepPreviousData,
  });
  const questionParams = { view: "OPEN" as const, page: questionsPage };
  const questionsQuery = useQuery({
    queryKey: queryKeys.buyerQuestions.list(questionParams),
    queryFn: () => getBuyerQuestions(questionParams),
    placeholderData: keepPreviousData,
  });

  const drives = drivesQuery.data?.success ? drivesQuery.data.data : null;
  const questions = questionsQuery.data?.success ? questionsQuery.data.data : null;

  const fail = (error: unknown) => toast.error(actionError(error as ActionError, t("failed")));
  const refreshDrives = () => queryClient.invalidateQueries({ queryKey: queryKeys.testDrives.all });
  const refreshQuestions = () => queryClient.invalidateQueries({ queryKey: queryKeys.buyerQuestions.all });

  const setDriveStatus = useMutation({
    mutationFn: async (input: { testDriveId: string; status: "CONFIRMED" | "CANCELLED" }) =>
      unwrap(await updateTestDriveStatus(input)),
    onSuccess: (_data, input) => toast.success(input.status === "CONFIRMED" ? t("confirmed") : t("declined")),
    onError: fail,
    onSettled: refreshDrives,
  });

  const answer = useMutation({
    mutationFn: async (input: { id: string; answer: string; appliesToAllCars: boolean }) =>
      unwrap(await answerBuyerQuestion(input)),
    onSuccess: () => toast.success(t("answered")),
    onError: fail,
    onSettled: refreshQuestions,
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => unwrap(await setBuyerQuestionStatus({ id, status: "DISMISSED" })),
    onSuccess: () => toast.success(t("dismissed")),
    onError: fail,
    onSettled: refreshQuestions,
  });

  const pendingId = setDriveStatus.isPending
    ? setDriveStatus.variables?.testDriveId
    : answer.isPending
      ? answer.variables?.id
      : dismiss.isPending
        ? dismiss.variables
        : undefined;

  return {
    view,
    drives: {
      items: (drives?.testDrives ?? []).filter(Boolean) as unknown as DriveRequest[],
      total: drives?.pagination.total ?? 0,
      page: drivesPage,
      totalPages: drives?.pagination.totalPages ?? 0,
      isLoading: drivesQuery.isLoading,
      isError: !!drivesQuery.error || drivesQuery.data?.success === false,
    },
    questions: {
      items: questions?.questions ?? [],
      total: questions?.counts.OPEN ?? 0,
      page: questionsPage,
      totalPages: questions?.pagination.totalPages ?? 0,
      isLoading: questionsQuery.isLoading,
      isError: !!questionsQuery.error || questionsQuery.data?.success === false,
    },
    pendingId,
    handlers: {
      setView: (next: RequestsView) => {
        setView(next);
        setDrivesPage(1);
        setQuestionsPage(1);
      },
      setDrivesPage,
      setQuestionsPage,
      confirmDrive: (testDriveId: string) => setDriveStatus.mutate({ testDriveId, status: "CONFIRMED" }),
      declineDrive: (testDriveId: string) => setDriveStatus.mutateAsync({ testDriveId, status: "CANCELLED" }),
      answer: (input: { id: string; answer: string; appliesToAllCars: boolean }) => answer.mutateAsync(input),
      dismiss: (id: string) => dismiss.mutate(id),
    },
  };
}

export type RequestsData = ReturnType<typeof useRequests>;
