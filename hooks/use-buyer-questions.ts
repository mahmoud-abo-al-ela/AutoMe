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
import type { BuyerQuestionView } from "@/lib/validations/schemas";

/** An action's payload, or its typed error thrown for the mutation to catch. */
function unwrap<T>(response: ActionResponse<T>): T {
  if (!response.success) throw response.error;
  return response.data;
}

/**
 * The dealer's buyer-question inbox: one view at a time, most-asked first.
 * Every write invalidates the whole inbox, because answering moves a
 * question between views and changes every view's count.
 */
export function useBuyerQuestions() {
  const t = useTranslations("org.buyerQuestions.toasts");
  const actionError = useActionError();
  const queryClient = useQueryClient();
  const [view, setView] = useState<BuyerQuestionView>("OPEN");
  const [page, setPage] = useState(1);

  const params = { view, page };
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
    view,
    questions: data?.questions ?? [],
    counts: data?.counts ?? null,
    pagination: data?.pagination ?? { page, limit: 20, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    isError,
    pendingId,
    retry: () => void query.refetch(),
    handlers: {
      selectView: (next: BuyerQuestionView) => {
        setView(next);
        setPage(1);
      },
      setPage,
      answer: (input: { id: string; answer: string; appliesToAllCars: boolean }) =>
        answer.mutateAsync(input),
      dismiss: (id: string) => changeStatus.mutateAsync({ id, status: "DISMISSED" }),
      reopen: (id: string) => changeStatus.mutateAsync({ id, status: "OPEN" }),
    },
  };
}
