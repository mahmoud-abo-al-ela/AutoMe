"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ErrorResponse } from "@/lib/utils/response";

type ActionError = ErrorResponse["error"];

/**
 * Turns a server action's error envelope into text for the reader.
 *
 * Actions return a message key plus params rather than a sentence, because
 * their responses are cached and shared across readers who do not share a
 * language. Resolution order:
 *
 *   1. the key the action sent, translated with its params
 *   2. `error.message`, the English developer-facing fallback
 *   3. a generic apology
 *
 * Falling through to (2) is deliberate. Anything thrown outside the AppError
 * hierarchy has no key, and showing its English message beats showing nothing
 * while those sites are migrated.
 */
export function useActionError() {
  const t = useTranslations("errors");

  return useCallback(
    (error: ActionError | undefined, fallback?: string): string => {
      if (!error) return fallback ?? t("generic");

      if (error.messageKey) {
        // Keys arrive namespaced ("errors.notFound") but this scope is already
        // inside `errors`, so the prefix is stripped before lookup.
        const key = error.messageKey.replace(/^errors\./, "");
        const params = { ...(error.messageParams ?? {}) };

        // A resource is an English noun from the throw site. Translate it when
        // we know it, otherwise pass it through — a slightly English sentence
        // beats a raw key or a blank.
        if (typeof params.resource === "string") {
          const resourceKey = `resources.${params.resource}`;
          params.resource = t.has(resourceKey)
            ? t(resourceKey)
            : params.resource;
        }

        if (t.has(key)) return t(key, params);
      }

      return error.message || fallback || t("generic");
    },
    [t]
  );
}
