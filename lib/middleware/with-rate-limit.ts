import aj, {
  ajChatTranslation,
  ajDealerAi,
  ajListingQuestions,
  ajSearchSuggest,
  ajSearchMeaning,
  ajMcpPublic,
  ajMcpCostly,
  ajMcpAccount,
  ajMcpAccountTestDrives,
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

async function enforce(instance: typeof aj, requested: number) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await instance.protect(req, { requested });

  assertArcjetAllowed(decision);
}

export async function enforceRateLimit(requested = 1) {
  return enforce(aj, requested);
}

export async function enforceDealerAiLimit(requested = 1) {
  return enforce(ajDealerAi, requested);
}

/**
 * Enforce the search-suggestions bucket (see ajSearchSuggest), for the route
 * that answers as a buyer types.
 */
export async function enforceSuggestLimit() {
  return enforce(ajSearchSuggest, 1);
}

export async function enforceSearchMeaningLimit() {
  return enforce(ajSearchMeaning, 1);
}

export async function enforceListingQuestionLimit(carId: string) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajListingQuestions.protect(req, { requested: 1, carId });

  assertArcjetAllowed(decision, "Too many questions. Please try again later.");
}

export async function enforceChatTranslationLimit(userId: string) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajChatTranslation.protect(req, { requested: 1, userId });

  assertArcjetAllowed(decision, "Too many translations. Please try again later.");
}

export async function enforceMcpPublicLimit() {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  // One constant for the shared ceiling — a value per caller would make it per caller.
  const decision = await ajMcpPublic.protect(req, { requested: 1, mcpScope: "all" });

  assertArcjetAllowed(decision);
}

/** Enforce the costly-call window (see ajMcpCostly), for a tool call that is one. */
export async function enforceMcpCostlyLimit() {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajMcpCostly.protect(req);

  assertArcjetAllowed(decision);
}

export async function enforceMcpAccountLimit(userId: string) {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajMcpAccount.protect(req, { requested: 1, userId });

  assertArcjetAllowed(decision);
}

/**
 * Enforce the daily test-drive limit on the signed-in MCP endpoint (see
 * ajMcpAccountTestDrives), per AutoMe user and per kind of change.
 */
export async function enforceMcpAccountTestDriveLimit(userId: string, action: "request" | "cancel") {
  assertArcjetConfigured();
  if (!arcjetConfigured) return;

  const req = await request();
  const decision = await ajMcpAccountTestDrives.protect(req, { userId, mcpAction: action });

  assertArcjetAllowed(decision, "Too many test-drive changes today. Please try again tomorrow.");
}
