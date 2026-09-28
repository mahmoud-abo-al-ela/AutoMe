import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/arcjet", () => ({ default: {}, ajListingQuestions: {}, arcjetConfigured: true, arcjetRequired: false }));
vi.mock("@arcjet/next", () => ({ request: vi.fn() }));

import { assertArcjetAllowed } from "@/lib/middleware/with-rate-limit";
import { RateLimitError } from "@/lib/utils/errors";
import { createErrorResponse } from "@/lib/utils/response";

function rateLimited(reason: { reset: number; resetTime?: Date }) {
  return {
    isErrored: () => false,
    isDenied: () => true,
    reason: { isRateLimit: () => true, remaining: 0, ...reason },
  } as never;
}

describe("assertArcjetAllowed — rate limits", () => {
  it("says how many seconds until a request is allowed again, so the page can count down", () => {
    const resetTime = new Date(Date.now() + 42_000);
    try {
      assertArcjetAllowed(rateLimited({ reset: 42, resetTime }));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBeGreaterThanOrEqual(41);
      expect((error as RateLimitError).retryAfter).toBeLessThanOrEqual(42);
      // …and it reaches the browser.
      expect(createErrorResponse(error).error).toMatchObject({ code: "RATE_LIMIT_EXCEEDED", retryAfter: expect.any(Number) });
    }
  });

  it("reads `reset` as seconds when there is no reset time", () => {
    expect(() => assertArcjetAllowed(rateLimited({ reset: 90 }))).toThrow(RateLimitError);
    try {
      assertArcjetAllowed(rateLimited({ reset: 90 }));
    } catch (error) {
      expect((error as RateLimitError).retryAfter).toBe(90);
    }
  });
});
