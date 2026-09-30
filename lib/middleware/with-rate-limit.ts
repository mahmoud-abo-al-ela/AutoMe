import aj, {
  ajChatTranslation,
  ajDealerAi,
  ajListingQuestions,
  arcjetConfigured,
  arcjetRequired,
} from "@/lib/arcjet";
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
      // `reset` is seconds until a request is allowed again — it was being
      // read as a date, so the user only ever heard "wait a moment". The page
      // now counts it down.
      const { reset, resetTime } = decision.reason;
      const seconds = resetTime
        ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
        : reset;
      const retryAfter = Math.max(1, Math.round(seconds));
      throw new RateLimitError(`${deniedMessage} Try again in ${retryAfter}s.`, {}, retryAfter);
    }
    // Shield and bot detection reach this branch. They run on the action path
    // now rather than in middleware, and the public photo search is the one
    // caller a real visitor can trip, so the reason has to be translatable.
    throw new ValidationError("Request denied", "request", {
      key: "errors.requestDenied",
    });
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
 * Enforce the shared Arcjet bucket (uploads, the public photo search, payments,
 * team and other dealer actions — dealer AI has its own, enforceDealerAiLimit).
 * Call at the top of an abuse-prone or costly server action, before doing any
 * work. `requested` is the number of tokens to consume (default 1).
 */
export async function enforceRateLimit(requested = 1) {
  return enforce(aj, requested);
}

/**
 * Enforce the dealer-AI bucket (see ajDealerAi): photo reads, translation
 * and the listing coach. Separate from the shared bucket so a run of AI work
 * cannot lock a dealer out of everything else for an hour.
 */
export async function enforceDealerAiLimit(requested = 1) {
  return enforce(ajDealerAi, requested);
}

/**
 * Enforce the buyer-question buckets: per IP and per car. `carId` must be the
 * validated id — it is the rate-limit key, so an unvalidated one would let a
 * caller mint a fresh bucket per request.
 */
export async function enforceListingQuestionLimit(carId: string) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajListingQuestions.protect(req, { requested: 1, carId });

  assertArcjetAllowed(decision, "Too many questions. Please try again later.");
}

/**
 * Enforce the chat-translation bucket (see ajChatTranslation). `userId` is the
 * signed-in user's database id — the bucket key, so it must never come from
 * the request.
 */
export async function enforceChatTranslationLimit(userId: string) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajChatTranslation.protect(req, { requested: 1, userId });

  assertArcjetAllowed(decision, "Too many translations. Please try again later.");
}
