import aj, { arcjetConfigured, arcjetRequired } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import {
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
} from "@/lib/utils/errors";
import { logError } from "@/lib/utils/errors";

/** An Arcjet decision, as returned by `protect`. */
type ArcjetDecision = Awaited<ReturnType<typeof aj.protect>>;

/**
 * Map an Arcjet decision onto a typed error, failing **closed**.
 *
 * Call sites used to check `isDenied()` only. An errored decision — Arcjet
 * unreachable, key rejected, request timed out — is neither denied nor allowed,
 * so it fell through and the action ran completely unprotected, which is the
 * exact moment protection matters most. Errors now refuse the request in
 * production; locally they are logged and allowed so an offline dev is not
 * blocked.
 *
 * Exported so the inline `aj.protect` call sites in `actions/` enforce the same
 * rules as `enforceRateLimit` without restating them.
 */
export function assertArcjetAllowed(
  decision: ArcjetDecision,
  deniedMessage = "Rate limit exceeded. Please try again later."
) {
  if (decision.isErrored()) {
    logError("Arcjet returned an errored decision", decision.reason);
    if (arcjetRequired) {
      throw new ServiceUnavailableError();
    }
    return;
  }

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const { remaining, reset } = decision.reason;
      throw new RateLimitError(
        `${deniedMessage} ${remaining} requests remaining until ${new Date(
          reset
        ).toLocaleString()}`
      );
    }
    throw new ValidationError("Request denied", "request");
  }
}

/**
 * Refuse to proceed when Arcjet is not configured in production — an empty key
 * makes the client no-op, which would remove rate limiting silently.
 */
export function assertArcjetConfigured() {
  if (!arcjetConfigured && arcjetRequired) {
    logError("ARCJET_KEY is not configured; refusing to run unprotected");
    throw new ServiceUnavailableError();
  }
}

/**
 * Run an Arcjet decision for the current request against `instance` and throw a
 * typed error if denied. Shared by the enforcers below so every call site
 * rate-limits and maps errors identically.
 */
async function enforce(instance: typeof aj, requested: number) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await instance.protect(req, { requested });

  assertArcjetAllowed(decision);
}

/**
 * Enforce the shared Arcjet bucket (dealer flows: car creation, image search).
 * Call at the top of an abuse-prone or costly server action, before doing any
 * work. `requested` is the number of tokens to consume (default 1).
 */
export async function enforceRateLimit(requested = 1) {
  return enforce(aj, requested);
}
