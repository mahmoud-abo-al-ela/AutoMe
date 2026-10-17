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
