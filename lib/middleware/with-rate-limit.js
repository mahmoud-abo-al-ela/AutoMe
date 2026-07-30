import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { RateLimitError, ValidationError } from "@/lib/utils/errors";

/**
 * Enforce Arcjet protection (rate limit + shield) for the current request.
 *
 * Call at the top of an abuse-prone or costly server action, before doing any
 * work. Throws a typed `RateLimitError` / `ValidationError` that the action's
 * auth wrapper maps to a standardized error response.
 *
 * Mirrors the inline pattern in `actions/cars.js` so every action rate-limits
 * the same way. `requested` is the number of tokens to consume (default 1).
 */
export async function enforceRateLimit(requested = 1) {
  const req = await request();
  const decision = await aj.protect(req, { requested });

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
