import { UNEXPECTED_ERROR_CODE, type ErrorResponse } from "./response";

/** The error envelope half of an action response. */
export type ActionError = ErrorResponse["error"];

/**
 * The part of a next-intl translator this needs, so the same function serves
 * both `useTranslations` (client) and `getTranslations` (server).
 */
export interface ErrorTranslator {
  (key: string, params?: Record<string, unknown>): string;
  has(key: string): boolean;
}

/**
 * Turn a server action's error envelope into text for the reader.
 *
 * Actions return a message key plus params rather than a sentence, because
 * their responses are cached and shared across readers who do not share a
 * language. Resolution order:
 *
 *   1. the key the action sent, translated with its params
 *   2. `error.message`, the English developer-facing fallback
 *   3. the caller's fallback, then a generic apology
 *
 * Falling through to (2) is deliberate for an AppError without a key: its
 * message was written for a reader, and English beats nothing while those
 * throw sites get keys. An unexpected error skips (2) — its message is a
 * placeholder the server substituted for the real one — so the caller's
 * contextual fallback ("couldn't update the wishlist") is what shows.
 *
 * `t` must be scoped to the `errors` namespace. `formatNumber` renders numeric
 * params in the reader's numerals before interpolation: next-intl formats a
 * raw number against the bare `ar` tag, which is Western digits, so "at most
 * 10 images" would print "10" inside an Arabic sentence.
 */
export function resolveActionError(
  t: ErrorTranslator,
  error: ActionError | undefined,
  fallback?: string,
  formatNumber?: (value: number) => string
): string {
  if (!error) return fallback ?? t("generic");

  if (error.messageKey) {
    // Keys arrive namespaced ("errors.notFound") but `t` is already inside
    // `errors`, so the prefix is stripped before lookup.
    const key = error.messageKey.replace(/^errors\./, "");
    const params: Record<string, unknown> = { ...(error.messageParams ?? {}) };
    if (formatNumber) {
      for (const [name, value] of Object.entries(params)) {
        if (typeof value === "number") params[name] = formatNumber(value);
      }
    }

    // A resource is an English noun from the throw site. Translate it when we
    // know it, otherwise pass it through — a slightly English sentence beats a
    // raw key or a blank.
    if (typeof params.resource === "string") {
      const resourceKey = `resources.${params.resource}`;
      params.resource = t.has(resourceKey) ? t(resourceKey) : params.resource;
    }

    if (t.has(key)) return t(key, params);
  }

  if (error.code === UNEXPECTED_ERROR_CODE) return fallback ?? t("generic");

  return error.message || fallback || t("generic");
}
