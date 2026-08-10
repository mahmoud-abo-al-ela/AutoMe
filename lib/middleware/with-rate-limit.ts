import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { RateLimitError, ValidationError } from "@/lib/utils/errors";

/**
 * Run an Arcjet decision for the current request against `instance` and throw a
 * typed error if denied. Shared by the enforcers below so every call site
 * rate-limits and maps errors identically.
 */
async function enforce(instance: typeof aj, requested: number) {
  const req = await request();
  const decision = await instance.protect(req, { requested });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const { remaining, reset } = decision.reason;
      throw new RateLimitError(
        `Rate limit exceeded. ${remaining} requests remaining until ${new Date(
          reset
        ).toLocaleString()}`
      );
    }
    throw new ValidationError("Request denied", "request");
  }
}

/**
 * Enforce the shared Arcjet bucket (dealer flows: car creation, image search).
 * Call at the top of an abuse-prone or costly server action, before doing any
 * work. `requested` is the number of tokens to consume (default 1).
 */
export async function enforceRateLimit(requested = 1) {
  return enforce(aj, requested);
}
