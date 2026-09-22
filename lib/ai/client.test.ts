import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

/**
 * The metering contract, tested at the only place that can enforce it.
 *
 * These cases exist because the defect they guard against already shipped once:
 * `createAiUsage` was written, indexed and wired into the plan gate, and simply
 * never called. "One row per provider attempt, on success and on failure" is
 * the invariant; everything below is a way for it to be broken.
 */

const generate = vi.hoisted(() => vi.fn());
const createAiUsage = vi.hoisted(() => vi.fn());
const countPlatformCallsSince = vi.hoisted(() => vi.fn());

// Only the two functions that touch the network are replaced; the error
// classification under test is the real implementation.
vi.mock("@/lib/ai/provider/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/provider/gemini")>();
  return { ...actual, generate, isConfigured: () => true };
});

vi.mock("@/lib/repositories/ai-usage", () => ({
  createAiUsage,
  countPlatformCallsSince,
}));

import { generateStructured } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { textPart } from "@/lib/ai/provider/gemini";
import * as cache from "@/lib/ai/cache";
import { ValidationError, ServiceUnavailableError } from "@/lib/utils/errors";

const schema = z.object({ make: z.string(), year: z.coerce.number() });

function ok(text: string, usage = {}) {
  return {
    text,
    usage: {
      inputTokens: 10,
      outputTokens: 5,
      thinkingTokens: 2,
      cachedTokens: 0,
      ...usage,
    },
  };
}

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

function call(overrides: Record<string, unknown> = {}) {
  return generateStructured({
    feature: AI_FEATURES.carListingFromImage,
    task: "vision",
    parts: [textPart("prompt")],
    schema,
    promptVersion: "test.1",
    ctx: { organizationId: "org-1", userId: "user-1" },
    ...overrides,
  });
}

/** The single ledger row written by a call that made exactly one attempt. */
function onlyRow() {
  expect(createAiUsage).toHaveBeenCalledTimes(1);
  return createAiUsage.mock.calls[0][0];
}

beforeEach(() => {
  vi.clearAllMocks();
  cache.clear();
  countPlatformCallsSince.mockResolvedValue(0);
});

describe("generateStructured — success", () => {
  it("returns validated data and records one row with the real token counts", async () => {
    generate.mockResolvedValue(ok('{"make":"Toyota","year":"2020"}'));

    const result = await call();

    expect(result).toEqual({ make: "Toyota", year: 2020 });

    const row = onlyRow();
    expect(row).toMatchObject({
      organizationId: "org-1",
      userId: "user-1",
      feature: AI_FEATURES.carListingFromImage,
      success: true,
      errorCode: null,
      inputTokens: 10,
      outputTokens: 5,
      thinkingTokens: 2,
    });
    expect(row.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("records the model it actually called, not a literal", async () => {
    generate.mockResolvedValue(ok('{"make":"Kia","year":2019}'));

    await call();

    expect(onlyRow().model).toBe(generate.mock.calls[0][0].model);
  });
});

describe("generateStructured — provider failures", () => {
  it("records a failed row with an error code and rethrows", async () => {
    generate.mockRejectedValue(httpError(400));

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);

    expect(onlyRow()).toMatchObject({
      success: false,
      errorCode: "HTTP_400",
    });
  });

  it("does not retry a non-retryable status", async () => {
    generate.mockRejectedValue(httpError(400));

    await expect(call()).rejects.toThrow();

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("retries a transient status and writes one row per attempt", async () => {
    generate
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce(ok('{"make":"Nissan","year":2021}'));

    const result = await call();

    expect(result).toEqual({ make: "Nissan", year: 2021 });
    expect(generate).toHaveBeenCalledTimes(2);

    // Two attempts reached the provider, so the ledger — which the free-tier
    // breaker reads — must show two requests, not one.
    expect(createAiUsage).toHaveBeenCalledTimes(2);
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({
      success: false,
      errorCode: "HTTP_503",
    });
    expect(createAiUsage.mock.calls[1][0]).toMatchObject({ success: true });
  });

  it("never lets a metering failure break the user's request", async () => {
    generate.mockResolvedValue(ok('{"make":"Honda","year":2018}'));
    createAiUsage.mockRejectedValue(new Error("ledger is down"));

    await expect(call()).resolves.toEqual({ make: "Honda", year: 2018 });
  });
});

describe("generateStructured — unusable responses", () => {
  it("rejects output that is not JSON and records INVALID_JSON", async () => {
    generate.mockResolvedValue(ok("I'm afraid I can't do that"));

    await expect(call()).rejects.toBeInstanceOf(ValidationError);

    expect(onlyRow()).toMatchObject({
      success: false,
      errorCode: "INVALID_JSON",
    });
  });

  it("rejects an empty body", async () => {
    generate.mockResolvedValue({
      text: undefined,
      usage: { inputTokens: 1, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0 },
    });

    await expect(call()).rejects.toBeInstanceOf(ValidationError);
    expect(onlyRow().errorCode).toBe("INVALID_JSON");
  });

  it("tolerates a fenced response with trailing junk", async () => {
    generate.mockResolvedValue(
      ok('```json\n{"make":"Fiat","year":2015}\n```\n}')
    );

    await expect(call()).resolves.toEqual({ make: "Fiat", year: 2015 });
  });

  it("rejects a response that parses but fails the schema", async () => {
    generate.mockResolvedValue(ok('{"make":"Toyota"}'));

    await expect(call()).rejects.toBeInstanceOf(ValidationError);

    expect(onlyRow()).toMatchObject({
      success: false,
      errorCode: "SCHEMA_REJECTED",
    });
  });

  it("does not retry an unusable response", async () => {
    generate.mockResolvedValue(ok("not json at all"));

    await expect(call()).rejects.toThrow();

    // The provider already accepted and billed the request; a second attempt
    // would spend another one on identical instructions.
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("records a schema rejection as a failure so it cannot burn a customer's quota", async () => {
    generate.mockResolvedValue(ok('{"make":123,"year":"nope"}'));

    await expect(call()).rejects.toThrow();

    // countOrgAiCallsThisMonth filters on success: true.
    expect(onlyRow().success).toBe(false);
  });
});

describe("generateStructured — platform breaker", () => {
  it("refuses without calling the provider once the daily cap is reached", async () => {
    countPlatformCallsSince.mockResolvedValue(100_000);

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);

    // The entire point is to not spend the request.
    expect(generate).not.toHaveBeenCalled();
    expect(createAiUsage).not.toHaveBeenCalled();
  });

  it("allows the call when the ledger cannot be read", async () => {
    countPlatformCallsSince.mockRejectedValue(new Error("db down"));
    generate.mockResolvedValue(ok('{"make":"Seat","year":2017}'));

    // An unreadable breaker must degrade to the previous behaviour, not take
    // every AI feature down with it.
    await expect(call()).resolves.toEqual({ make: "Seat", year: 2017 });
  });
});

describe("generateStructured — timeout", () => {
  it("gives up on a hung call and records it", async () => {
    generate.mockImplementation(() => new Promise(() => {}));

    await expect(call({ timeoutMs: 20 })).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );

    expect(onlyRow()).toMatchObject({ success: false, errorCode: "TIMEOUT" });
  });

  it("does not retry a timeout", async () => {
    generate.mockImplementation(() => new Promise(() => {}));

    await expect(call({ timeoutMs: 20 })).rejects.toThrow();

    // Aborting is client-side only: Google still billed the first attempt.
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe("generateStructured — response cache", () => {
  it("serves a repeat of the same bytes without calling the provider", async () => {
    generate.mockResolvedValue(ok('{"make":"Mazda","year":2016}'));
    const bytes = Buffer.from("the same image");

    const first = await call({ cacheBytes: bytes });
    const second = await call({ cacheBytes: bytes });

    expect(second).toEqual(first);
    expect(generate).toHaveBeenCalledTimes(1);
    // A row means "a request was sent"; the second call sent none.
    expect(createAiUsage).toHaveBeenCalledTimes(1);
  });

  it("does not serve a cached answer across a prompt change", async () => {
    generate.mockResolvedValue(ok('{"make":"Opel","year":2014}'));
    const bytes = Buffer.from("same image, new instructions");

    await call({ cacheBytes: bytes, promptVersion: "v1" });
    await call({ cacheBytes: bytes, promptVersion: "v2" });

    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("stays out of the way when no cache key is supplied", async () => {
    generate.mockResolvedValue(ok('{"make":"Skoda","year":2013}'));

    await call();
    await call();

    expect(generate).toHaveBeenCalledTimes(2);
  });
});
