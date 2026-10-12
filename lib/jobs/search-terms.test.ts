import { describe, it, expect, vi, beforeEach } from "vitest";

const publishJSON = vi.hoisted(() => vi.fn());
const refreshSearchVocabulary = vi.hoisted(() => vi.fn());
const afterQueue = vi.hoisted(() => [] as (() => unknown)[]);

vi.mock("next/server", () => ({ after: (run: () => unknown) => afterQueue.push(run) }));
vi.mock("@upstash/qstash", () => ({
  Client: class {
    publishJSON = publishJSON;
  },
}));
vi.mock("@/lib/services/car/search-vocabulary", () => ({ refreshSearchVocabulary }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { resetJobsForTests } from "@/lib/jobs";
import { SEARCH_TERMS_WINDOW_SECONDS, searchTermsChanged, searchTermsSchedule } from "@/lib/jobs/search-terms";

const URL_A = "https://autome.example/api/jobs/search-terms";
const URL_B = "https://preview.autome.example/api/jobs/search-terms";
/** The start of a window, in milliseconds. */
const WINDOW_START = 5_000 * SEARCH_TERMS_WINDOW_SECONDS * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  afterQueue.length = 0;
  resetJobsForTests();
  delete process.env.QSTASH_TOKEN;
  process.env.NEXT_PUBLIC_APP_URL = "https://autome.example";
});

describe("searchTermsSchedule", () => {
  it("gives every change in one window the same job", () => {
    const first = searchTermsSchedule(WINDOW_START, URL_A);
    const last = searchTermsSchedule(WINDOW_START + SEARCH_TERMS_WINDOW_SECONDS * 1000 - 1, URL_A);
    expect(last).toEqual(first);
  });

  it("starts a new job in the next window", () => {
    const now = searchTermsSchedule(WINDOW_START, URL_A);
    const next = searchTermsSchedule(WINDOW_START + SEARCH_TERMS_WINDOW_SECONDS * 1000, URL_A);
    expect(next.deduplicationId).not.toBe(now.deduplicationId);
    expect(next.notBefore - now.notBefore).toBe(SEARCH_TERMS_WINDOW_SECONDS);
  });

  it("delivers after the window closes, in seconds, so the refresh sees every change in it", () => {
    const { notBefore } = searchTermsSchedule(WINDOW_START + 1234, URL_A);
    const windowEnd = WINDOW_START / 1000 + SEARCH_TERMS_WINDOW_SECONDS;
    expect(notBefore).toBeGreaterThan(windowEnd);
    expect(notBefore).toBeLessThan(windowEnd + 60);
  });

  it("keeps one deployment's job apart from another's", () => {
    expect(searchTermsSchedule(WINDOW_START, URL_A).deduplicationId).not.toBe(
      searchTermsSchedule(WINDOW_START, URL_B).deduplicationId
    );
  });
});

describe("searchTermsChanged", () => {
  it("queues one deduplicated, delayed refresh", async () => {
    process.env.QSTASH_TOKEN = "t";
    await searchTermsChanged(WINDOW_START);

    expect(publishJSON).toHaveBeenCalledWith({
      url: URL_A,
      body: {},
      retries: 3,
      ...searchTermsSchedule(WINDOW_START, URL_A),
    });
    expect(refreshSearchVocabulary).not.toHaveBeenCalled();
  });

  it("refreshes after the response when there is no queue", async () => {
    await searchTermsChanged(WINDOW_START);
    expect(publishJSON).not.toHaveBeenCalled();

    await afterQueue[0]();
    expect(refreshSearchVocabulary).toHaveBeenCalledTimes(1);
  });

  it("never fails the change that called it", async () => {
    process.env.QSTASH_TOKEN = "t";
    publishJSON.mockRejectedValue(new Error("queue down"));
    refreshSearchVocabulary.mockRejectedValue(new Error("db down"));

    await expect(searchTermsChanged(WINDOW_START)).resolves.toBeUndefined();
    await afterQueue[0]();
  });
});
