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
import { modelsFor } from "@/lib/ai/models";
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
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce(ok('{"make":"Nissan","year":2021}'));

    const result = await call();

    expect(result).toEqual({ make: "Nissan", year: 2021 });
    expect(generate).toHaveBeenCalledTimes(2);

    // Same model both times — a 500 is a blip in front of the model, not a
    // statement about it.
    const [first, second] = generate.mock.calls.map((c) => c[0].model);
    expect(second).toBe(first);

    // Two attempts reached the provider, so the ledger — which the free-tier
    // breaker reads — must show two requests, not one.
    expect(createAiUsage).toHaveBeenCalledTimes(2);
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({
      success: false,
      errorCode: "HTTP_500",
    });
    expect(createAiUsage.mock.calls[1][0]).toMatchObject({ success: true });
  });

  it("retries the same model when the request never reached the API", async () => {
    // No status: DNS, socket, TLS. The model is fine; the path to it was not.
    generate
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(ok('{"make":"Suzuki","year":2020}'));

    await expect(call()).resolves.toEqual({ make: "Suzuki", year: 2020 });

    const [first, second] = generate.mock.calls.map((c) => c[0].model);
    expect(second).toBe(first);
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

  it("keeps the top of the daily cap for standard callers", async () => {
    // 350 of the default 500/day: past the low-priority 60% share, under the
    // full cap. The per-minute window stays quiet so only the daily cap decides.
    countPlatformCallsSince.mockImplementation(async (since: Date) =>
      Date.now() - since.getTime() <= 60_000 ? 0 : 350
    );
    generate.mockResolvedValue(ok('{"make":"Kia","year":2021}'));

    await expect(
      call({ ctx: { organizationId: "org-free", userId: "u", priority: "low" } })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(generate).not.toHaveBeenCalled();

    await expect(call()).resolves.toEqual({ make: "Kia", year: 2021 });
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

describe("generateStructured — model fallback", () => {
  it("moves to the next model when one has been retired", async () => {
    // Google retires a model for a key without notice; the repo already
    // carries a comment about gemini-2.5-flash 404ing for newer keys.
    generate
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce(ok('{"make":"Peugeot","year":2022}'));

    await expect(call()).resolves.toEqual({ make: "Peugeot", year: 2022 });

    const [first, second] = generate.mock.calls.map((c) => c[0].model);
    expect(second).not.toBe(first);
  });

  it("records the failed model and the one that answered", async () => {
    generate
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce(ok('{"make":"Renault","year":2021}'));

    await call();

    expect(createAiUsage).toHaveBeenCalledTimes(2);
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({
      success: false,
      errorCode: "HTTP_404",
    });
    expect(createAiUsage.mock.calls[1][0]).toMatchObject({ success: true });
    // Which model burned the request has to be answerable from the ledger.
    expect(createAiUsage.mock.calls[0][0].model).not.toBe(
      createAiUsage.mock.calls[1][0].model
    );
  });

  it("treats a 400 naming the model as a retirement", async () => {
    generate
      .mockRejectedValueOnce(
        Object.assign(new Error("models/x is not found for API version v1"), {
          status: 400,
        })
      )
      .mockResolvedValueOnce(ok('{"make":"Cupra","year":2023}'));

    await expect(call()).resolves.toEqual({ make: "Cupra", year: 2023 });
  });

  it("does not walk the chain for a fault every model would share", async () => {
    generate.mockRejectedValue(httpError(400));

    await expect(call()).rejects.toThrow();

    // A malformed request fails identically on every model; walking the chain
    // would spend the quota three times to learn that.
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("does not walk the chain when the response is unusable", async () => {
    generate.mockResolvedValue(ok("not json"));

    await expect(call()).rejects.toBeInstanceOf(ValidationError);

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("gives up once the last model is exhausted", async () => {
    generate.mockRejectedValue(httpError(404));

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);

    // Every model in the chain was tried exactly once — 404 is not retryable.
    expect(generate.mock.calls.length).toBeGreaterThan(1);
    const models = generate.mock.calls.map((c) => c[0].model);
    expect(new Set(models).size).toBe(models.length);
  });
});

describe("generateStructured — saturated models", () => {
  it.each([
    ["503 high demand", 503],
    ["429 rate limited", 429],
  ])("moves to a different model on %s", async (_label, status) => {
    // Observed live: gemini-3.7-flash answered "This model is currently
    // experiencing high demand." Asking the same overloaded model again is the
    // one response that cannot help.
    generate
      .mockRejectedValueOnce(httpError(status))
      .mockResolvedValueOnce(ok('{"make":"Mitsubishi","year":2019}'));

    await expect(call()).resolves.toEqual({ make: "Mitsubishi", year: 2019 });

    expect(generate).toHaveBeenCalledTimes(2);
    const [first, second] = generate.mock.calls.map((c) => c[0].model);
    expect(second).not.toBe(first);
  });

  it("spends one request per model rather than retrying a busy one", async () => {
    generate.mockRejectedValue(httpError(503));

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);

    // Every model tried exactly once — no model is asked twice while busy.
    const models = generate.mock.calls.map((c) => c[0].model);
    expect(new Set(models).size).toBe(models.length);
    expect(models.length).toBeGreaterThan(1);
  });

  it("records every saturated model it tried", async () => {
    generate.mockRejectedValue(httpError(503));

    await expect(call()).rejects.toThrow();

    // Each one was a real request against the free-tier cap the breaker reads.
    expect(createAiUsage).toHaveBeenCalledTimes(generate.mock.calls.length);
    for (const [row] of createAiUsage.mock.calls) {
      expect(row).toMatchObject({ success: false, errorCode: "HTTP_503" });
    }
  });
});

describe("generateStructured — the wall-clock budget", () => {
  it("stops walking the chain once the budget is gone", async () => {
    // Each model burns the whole budget being slow, then 503s.
    generate.mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(httpError(503)), 40)
        )
    );

    await expect(call({ budgetMs: 60, timeoutMs: 5_000 })).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );

    // Without a budget this would have tried every model in the chain.
    expect(generate.mock.calls.length).toBeLessThan(3);
  });

  it("refuses rather than spending a request it cannot hear the answer to", async () => {
    generate.mockResolvedValue(ok('{"make":"Audi","year":2020}'));

    // Already past the deadline before the first attempt.
    await expect(call({ budgetMs: -1 })).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );

    // A request sent into a function about to be killed is pure waste: the
    // caller never receives it and the ledger write never runs.
    expect(generate).not.toHaveBeenCalled();
  });

  it("clamps an attempt to the budget rather than its own timeout", async () => {
    generate.mockImplementation(() => new Promise(() => {}));

    const started = Date.now();
    await expect(call({ budgetMs: 40, timeoutMs: 30_000 })).rejects.toThrow();

    // The 30s per-attempt ceiling must not outlive a 40ms budget.
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it("still records the attempt it gave up on", async () => {
    generate.mockImplementation(() => new Promise(() => {}));

    await expect(call({ budgetMs: 40, timeoutMs: 30_000 })).rejects.toThrow();

    // The point of budgeting inside the process: the ledger write still runs,
    // where a platform kill would have lost the row entirely.
    expect(createAiUsage).toHaveBeenCalled();
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({ success: false });
  });
});

describe("generateStructured — progress", () => {
  it("does not stream when nobody listens", async () => {
    generate.mockResolvedValue(ok('{"make":"Fiat","year":2019}'));
    await call();
    expect(generate.mock.calls[0][0].onText).toBeUndefined();
  });

  it("reports each attempt and the streamed text, in order", async () => {
    const events: unknown[] = [];
    generate
      .mockRejectedValueOnce(httpError(503))
      .mockImplementationOnce(async (req: { onText?: (t: string) => void }) => {
        req.onText?.('{"make":"Fiat"');
        req.onText?.('{"make":"Fiat","year":2019}');
        return ok('{"make":"Fiat","year":2019}');
      });

    await call({ onProgress: (e: unknown) => events.push(e) });

    expect(events).toEqual([
      expect.objectContaining({ type: "attempt", modelIndex: 0, retry: false }),
      // The first model was busy: the fallback is its own, real, attempt.
      expect.objectContaining({ type: "attempt", modelIndex: 1, retry: false }),
      { type: "text", text: '{"make":"Fiat"' },
      { type: "text", text: '{"make":"Fiat","year":2019}' },
    ]);
  });

  it("reports a cache hit instead of an attempt", async () => {
    generate.mockResolvedValue(ok('{"make":"Fiat","year":2019}'));
    const bytes = Buffer.from("same photo");
    await call({ cacheBytes: bytes });

    const events: unknown[] = [];
    await call({ cacheBytes: bytes, onProgress: (e: unknown) => events.push(e) });
    expect(events).toEqual([{ type: "cached" }]);
  });

  it("never lets a throwing listener cost the call", async () => {
    generate.mockResolvedValue(ok('{"make":"Fiat","year":2019}'));
    await expect(
      call({
        onProgress: () => {
          throw new Error("UI gone");
        },
      })
    ).resolves.toEqual({ make: "Fiat", year: 2019 });
  });

  it("passes the thinking level to the provider", async () => {
    generate.mockResolvedValue(ok('{"make":"Fiat","year":2019}'));
    await call({ thinking: "low" });
    expect(generate.mock.calls[0][0].thinking).toBe("low");
  });
});

describe("generateStructured — queued models", () => {
  /** A model that accepts the request and never starts answering. */
  const queuedForever = (req: { signal?: AbortSignal }) =>
    new Promise((_, reject) => {
      req.signal?.addEventListener("abort", () =>
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
      );
    });

  it("hands a queued model over to the next one", async () => {
    generate
      .mockImplementationOnce(queuedForever)
      .mockResolvedValueOnce(ok('{"make":"Opel","year":2018}'));

    await expect(call({ firstTokenTimeoutMs: 20 })).resolves.toEqual({ make: "Opel", year: 2018 });

    const [first, second] = generate.mock.calls.map((c) => c[0].model);
    expect(second).not.toBe(first);
    // Recorded, so the ledger shows the queue rather than a silent gap.
    expect(createAiUsage.mock.calls[0][0]).toMatchObject({ success: false, errorCode: "QUEUE_TIMEOUT" });
  });

  it("does not retry a queued model on itself", async () => {
    generate
      .mockImplementationOnce(queuedForever)
      .mockResolvedValueOnce(ok('{"make":"Opel","year":2018}'));

    await call({ firstTokenTimeoutMs: 20 });

    const models = generate.mock.calls.map((c) => c[0].model);
    expect(new Set(models).size).toBe(models.length);
  });

  it("gives the last model the rest of the budget instead of the first-token limit", async () => {
    // Every model queues; only the last one is allowed to wait it out.
    generate.mockImplementation(async (req: { model: string; onText?: (t: string) => void }) => {
      const last = generate.mock.calls.length === chainLength();
      if (!last) return queuedForever(req as { signal?: AbortSignal });
      await new Promise((r) => setTimeout(r, 60));
      req.onText?.('{"make":"Opel","year":2018}');
      return ok('{"make":"Opel","year":2018}');
    });

    await expect(call({ firstTokenTimeoutMs: 20, budgetMs: 5_000 })).resolves.toEqual({
      make: "Opel",
      year: 2018,
    });
  });

  it("keeps a model that has started writing, however long it takes", async () => {
    generate.mockImplementationOnce(async (req: { onText?: (t: string) => void }) => {
      req.onText?.('{"make"');
      await new Promise((r) => setTimeout(r, 60));
      return ok('{"make":"Opel","year":2018}');
    });

    await expect(call({ firstTokenTimeoutMs: 20 })).resolves.toEqual({ make: "Opel", year: 2018 });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("never sends the thinking control to a Gemma model", async () => {
    generate.mockImplementation(async (req: { model: string }) =>
      req.model.startsWith("gemma-")
        ? ok('{"make":"Opel","year":2018}')
        : Promise.reject(httpError(503))
    );

    await call({ thinking: "low" });

    const gemma = generate.mock.calls.map((c) => c[0]).find((r) => r.model.startsWith("gemma-"));
    expect(gemma).toBeDefined();
    expect(gemma.thinking).toBeUndefined();
    // Flash models still got it.
    expect(generate.mock.calls[0][0].thinking).toBe("low");
  });
});

/** Models in the vision chain, which call() uses. */
function chainLength() {
  return modelsFor("vision").length;
}
