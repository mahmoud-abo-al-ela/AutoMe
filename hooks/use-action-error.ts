"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import {
  resolveActionError,
  type ActionError,
  type ErrorTranslator,
} from "@/lib/utils/error-messages";

export function useActionError() {
  const t = useTranslations("errors");
  const { number } = useFormatters();

  return useCallback(
    (error: ActionError | undefined, fallback?: string): string =>
      resolveActionError(t as unknown as ErrorTranslator, error, fallback, (n) => number(n)),
    [t, number]
  );
}
