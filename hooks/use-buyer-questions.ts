"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  answerBuyerQuestion,
  getBuyerQuestions,
  setBuyerQuestionStatus,
} from "@/actions/buyer-questions";
import { queryKeys } from "@/lib/query-client";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import type { ActionResponse } from "@/lib/utils/response";

export type BuyerQuestionTab = "OPEN" | "ANSWERED" | "DISMISSED";

/** An action's payload, or its typed error thrown for the mutation to catch. */
function unwrap<T>(response: ActionResponse<T>): T {
  if (!response.success) throw response.error;
  return response.data;
}

/**
 * The dealer's buyer-question inbox: one status tab at a time, most-asked
 * first. Every write invalidates the whole inbox, because answering moves a
 * question between tabs and changes every tab's count.
 */
export function useBuyerQuestions() {
  const t = useTranslations("org.buyerQuestions.toasts");
  const actionError = useActionError();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BuyerQuestionTab>("OPEN");
  const [page, setPage] = useState(1);

  const params = { status, page };
  const query = useQuery({
    queryKey: queryKeys.buyerQuestions.list(params),
    queryFn: () => getBuyerQuestions(params),
    placeholderData: keepPreviousData,
  });

  const data = query.data?.success ? query.data.data : null;
  const isError = !!query.error || query.data?.success === false;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.buyerQuestions.all });
  const fail = (error: unknown) =>
    toast.error(actionError(error as ActionError, t("failed")));

  const answer = useMutation({
    mutationFn: async (input: { id: string; answer: string; appliesToAllCars: boolean }) =>
      unwrap(await answerBuyerQuestion(input)),
    onSuccess: () => toast.success(t("answered")),
    onError: fail,
    onSettled: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: async (input: { id: string; status: "OPEN" | "DISMISSED" }) =>
      unwrap(await setBuyerQuestionStatus(input)),
    onSuccess: (_data, input) =>
      toast.success(input.status === "DISMISSED" ? t("dismissed") : t("reopened")),
    onError: fail,
    onSettled: invalidate,
  });

  const pendingId = answer.isPending
    ? answer.variables?.id
    : changeStatus.isPending
      ? changeStatus.variables?.id
      : undefined;

  return {
    status,
    questions: data?.questions ?? [],
    counts: data?.counts ?? { OPEN: 0, ANSWERED: 0, DISMISSED: 0 },
    pagination: data?.pagination ?? { page, limit: 20, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    isError,
    pendingId,
    handlers: {
      selectTab: (tab: BuyerQuestionTab) => {
        setStatus(tab);
        setPage(1);
      },
      setPage,
      answer: (input: { id: string; answer: string; appliesToAllCars: boolean }) =>
        answer.mutateAsync(input),
      dismiss: (id: string) => changeStatus.mutate({ id, status: "DISMISSED" }),
      reopen: (id: string) => changeStatus.mutate({ id, status: "OPEN" }),
    },
  };
}
