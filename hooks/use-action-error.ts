"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  resolveActionError,
  type ActionError,
  type ErrorTranslator,
} from "@/lib/utils/error-messages";

/**
 * Client-side binding of `resolveActionError` to the active locale.
 *
 * The resolution itself lives in `lib/utils/error-messages` so that server
 * components — the checkout-return page, for one — can render the same error
 * the same way without a hook.
 */
export function useActionError() {
  const t = useTranslations("errors");

  return useCallback(
    (error: ActionError | undefined, fallback?: string): string =>
      resolveActionError(t as unknown as ErrorTranslator, error, fallback),
    [t]
  );
}
