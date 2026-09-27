import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

/**
 * The client across more than one provider: CodeCraft (OpenAI-compatible, over
 * `fetch`) in front of Google (the Gemini SDK, mocked here). The single-provider
 * metering contract is in client.test.ts; this is what changes with two.
 */

const generate = vi.hoisted(() => vi.fn());
const createAiUsage = vi.hoisted(() => vi.fn());
const countPlatformCallsSince = vi.hoisted(() => vi.fn());
const sumProviderTokensSince = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/provider/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/provider/gemini")>();
  return { ...actual, generate, isConfigured: () => true };
});
vi.mock("@/lib/repositories/ai-usage", () => ({
  createAiUsage,
  countPlatformCallsSince,
  sumProviderTokensSince,
}));

import { generateStructured, type AiProgressEvent } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { imagePart, textPart } from "@/lib/ai/provider/types";
import * as cache from "@/lib/ai/cache";
import { ServiceUnavailableError } from "@/lib/utils/errors";

const schema = z.object({ make: z.string(), year: z.coerce.number() });
const fetchMock = vi.fn();

function chatReply(content: string, usage: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 300, completion_tokens: 500, ...usage },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function chatError(status: number) {
  return new Response(JSON.stringify({ error: { message: `HTTP ${status}` } }), { status });
}

function googleOk() {
  return {
    text: '{"make":"Kia","year":2019}',
    usage: { inputTokens: 10, outputTokens: 5, thinkingTokens: 0, cachedTokens: 0 },
  };
}

function call(overrides: Record<string, unknown> = {}) {
  return generateStructured({
    feature: AI_FEATURES.listingTranslation,
    task: "text",
    parts: [textPart("prompt")],
    schema,
    promptVersion: "test.1",
    ctx: { organizationId: "org-1", userId: "user-1" },
    ...overrides,
  });
}

const rows = () => createAiUsage.mock.calls.map((c) => c[0]);
const requestBody = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1].body);

beforeEach(() => {
  vi.clearAllMocks();
  cache.clear();
  process.env.CODECRAFT_API_KEY = "test-key";
  vi.stubGlobal("fetch", fetchMock);
  countPlatformCallsSince.mockResolvedValue(0);
  sumProviderTokensSince.mockResolvedValue(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CODECRAFT_API_KEY;
});

describe("provider order", () => {
  it("answers from CodeCraft first and records which provider served it", async () => {
    fetchMock.mockResolvedValue(chatReply('{"make":"Toyota","year":2020}'));

    await expect(call()).resolves.toEqual({ make: "Toyota", year: 2020 });

    expect(generate).not.toHaveBeenCalled();
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({
      provider: "codecraft",
      model: "gemini-3.7-flash",
      success: true,
      inputTokens: 300,
      outputTokens: 500,
    });
    expect(fetchMock.mock.calls[0][0]).toBe("https://codecraftapi.com/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-key");
  });

  it("walks from a busy CodeCraft to Google, recording every attempt", async () => {
    fetchMock.mockResolvedValue(chatError(503));
    generate.mockResolvedValue(googleOk());

    await expect(call()).resolves.toEqual({ make: "Kia", year: 2019 });

    expect(rows().map((r) => [r.provider, r.model, r.success])).toEqual([
      ["codecraft", "gemini-3.7-flash", false],
      ["codecraft", "gpt-5.6-luna", false],
      ["google", "gemini-3.6-flash", true],
    ]);
  });

  it("skips the rest of a provider whose key is rejected", async () => {
    fetchMock.mockResolvedValue(chatError(401));
    generate.mockResolvedValue(googleOk());

    await call();

    // One request proves the key is bad; the second CodeCraft model would
    // refuse identically.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("skips a provider whose monthly allowance is spent, without calling it", async () => {
    sumProviderTokensSince.mockImplementation(async (provider: string) =>
      provider === "codecraft" ? 1_000_000 : 0
    );
    generate.mockResolvedValue(googleOk());

    await call();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(rows()[0].provider).toBe("google");
  });

  it("refuses as busy only when every provider is at its cap", async () => {
    countPlatformCallsSince.mockResolvedValue(1_000);

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("counts each provider's calls against its own caps", async () => {
    fetchMock.mockResolvedValue(chatReply('{"make":"Toyota","year":2020}'));
    await call();
    const providers = countPlatformCallsSince.mock.calls.map((c) => c[1]);
    expect(new Set(providers)).toEqual(new Set(["codecraft", "google"]));
  });

  it("does not cut off a provider that sends its whole reply at the end", async () => {
    // CodeCraft buffers: no text until the answer is complete. A first-token
    // limit would read that as "queued" and throw away a working call.
    fetchMock.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 60));
      return chatReply('{"make":"Toyota","year":2020}');
    });

    await expect(call({ firstTokenTimeoutMs: 20 })).resolves.toEqual({ make: "Toyota", year: 2020 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
  });

  it("asks the next provider when one is too slow, but not the same provider again", async () => {
    // Never answers; aborts when the per-attempt timeout fires.
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
          )
        )
    );
    generate.mockResolvedValue(googleOk());

    await expect(call({ timeoutMs: 30, budgetMs: 5_000 })).resolves.toEqual({ make: "Kia", year: 2019 });

    // CodeCraft's second model is skipped: the provider is slow right now,
    // and a timeout is not retried. Google, a different provider, is asked.
    expect(rows().map((r) => [r.provider, r.errorCode])).toEqual([
      ["codecraft", "TIMEOUT"],
      ["google", null],
    ]);
  });

  it("uses Google alone when CodeCraft has no key", async () => {
    delete process.env.CODECRAFT_API_KEY;
    generate.mockResolvedValue(googleOk());

    await call();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(rows()[0].provider).toBe("google");
  });
});

describe("the OpenAI-compatible request", () => {
  it("sends images as data URLs, the schema, and 'think less' as minimal effort", async () => {
    fetchMock.mockResolvedValue(chatReply('{"make":"Toyota","year":2020}'));

    await call({ task: "vision", parts: [textPart("look"), imagePart("QUJD", "image/jpeg")], thinking: "low" });

    const body = requestBody();
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "look" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,QUJD" } },
    ]);
    expect(body.reasoning_effort).toBe("minimal");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.schema.properties.make).toBeDefined();
    expect(body.max_tokens).toBeGreaterThan(0);
  });

  it("splits reasoning tokens out of completion tokens, like Gemini reports them", async () => {
    fetchMock.mockResolvedValue(
      chatReply('{"make":"Toyota","year":2020}', {
        completion_tokens: 500,
        completion_tokens_details: { reasoning_tokens: 420 },
        prompt_tokens_details: { cached_tokens: 100 },
      })
    );

    await call();

    expect(rows()[0]).toMatchObject({ outputTokens: 80, thinkingTokens: 420, cachedTokens: 100 });
  });

  it("streams server-sent events as progress, with usage from the last chunk", async () => {
    const sse = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: '{"make":' } }] })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: '"Opel","year":2018}' } }] })}`,
      `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 12, completion_tokens: 7 } })}`,
      "data: [DONE]",
      "",
    ].join("\n");
    fetchMock.mockResolvedValue(new Response(sse, { status: 200 }));
    const events: AiProgressEvent[] = [];

    await expect(call({ onProgress: (e: AiProgressEvent) => events.push(e) })).resolves.toEqual({
      make: "Opel",
      year: 2018,
    });

    expect(requestBody().stream).toBe(true);
    expect(events.filter((e) => e.type === "text").at(-1)).toEqual({
      type: "text",
      text: '{"make":"Opel","year":2018}',
    });
    expect(events[0]).toMatchObject({ type: "attempt", provider: "codecraft" });
    expect(rows()[0]).toMatchObject({ inputTokens: 12, outputTokens: 7 });
  });

  it("does not put the provider's error body in the ledger", async () => {
    fetchMock.mockResolvedValue(chatError(400));

    await expect(call()).rejects.toBeInstanceOf(ServiceUnavailableError);

    expect(rows()[0].errorCode).toBe("HTTP_400");
  });
});
