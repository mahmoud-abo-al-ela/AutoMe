import { PAYMOB_BASE_URL } from "./config";

/**
 * One request to Paymob's API. Every call has a timeout: a hung request must
 * not hold a checkout, a callback or the renewal job open indefinitely.
 */

const TIMEOUT_MS = 15_000;

/** Paymob answered with an error, or did not answer. Never carries credentials. */
export class PaymobApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number | null,
    readonly detail: string
  ) {
    super(`Paymob ${path} failed${status ? ` (${status})` : ""}: ${detail}`);
    this.name = "PaymobApiError";
  }
}

export async function paymobRequest<T>(
  path: string,
  {
    method = "POST",
    authorization,
    body,
  }: { method?: "GET" | "POST"; authorization?: string; body?: unknown }
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PAYMOB_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new PaymobApiError(path, null, error instanceof Error ? error.message : String(error));
  }

  const text = await response.text();
  if (!response.ok) {
    // Paymob's error bodies are field messages ({"detail": ...}); a long HTML
    // page from a gateway in front of it is cut short.
    throw new PaymobApiError(path, response.status, text.slice(0, 500));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PaymobApiError(path, response.status, "response was not JSON");
  }
}
