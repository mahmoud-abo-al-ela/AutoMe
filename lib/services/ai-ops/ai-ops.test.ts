import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repo = vi.hoisted(() => ({
  getUsageByFeature: vi.fn(),
  getUsageByModel: vi.fn(),
  getFailuresByCode: vi.fn(),
  findRecentFailures: vi.fn(),
  findRecentTraces: vi.fn(),
  findTraceById: vi.fn(),
}));
vi.mock("@/lib/repositories/ai-usage", () => repo);
vi.mock("@/lib/repositories/ai-trace", () => repo);

import {
  OPS_LIMITS,
  aiUsageSummary,
  compareEvalRuns,
  getTrace,
  listRecentTraces,
  recentAiErrors,
  summarizeEvalReport,
} from "@/lib/services/ai-ops";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

const NOW = new Date("2026-10-13T12:00:00Z").getTime();
const DAY = 86_400_000;

beforeEach(() => {
  vi.resetAllMocks();
  repo.getUsageByFeature.mockResolvedValue([]);
  repo.getUsageByModel.mockResolvedValue([]);
  repo.getFailuresByCode.mockResolvedValue([]);
  repo.findRecentFailures.mockResolvedValue([]);
  repo.findRecentTraces.mockResolvedValue([]);
});

describe("usage and errors", () => {
  it("sums the features into platform totals", async () => {
    const row = { calls: 10, failures: 2, inputTokens: 100, outputTokens: 50, thinkingTokens: 5, cachedTokens: 0, costMicroUsd: 7 };
    repo.getUsageByFeature.mockResolvedValue([{ feature: "a", ...row }, { feature: "b", ...row }]);
    const summary = await aiUsageSummary(7, NOW);
    expect(summary.since).toBe(new Date(NOW - 7 * DAY).toISOString());
    expect(summary.totals).toEqual({ calls: 20, failures: 4, inputTokens: 200, outputTokens: 100, thinkingTokens: 10, costMicroUsd: 14 });
  });

  it("never reads further back or more rows than the limits, whatever it is asked", async () => {
    await aiUsageSummary(400, NOW);
    expect(repo.getUsageByFeature).toHaveBeenCalledWith(new Date(NOW - OPS_LIMITS.maxDays * DAY));
    await recentAiErrors(0, 10_000, NOW);
    expect(repo.findRecentFailures).toHaveBeenCalledWith(new Date(NOW - DAY), OPS_LIMITS.maxErrors);
  });
});

describe("traces", () => {
  const stored = {
    id: "t1",
    aiUsageId: null,
    createdAt: new Date(NOW),
    feature: "listing_qa",
    model: "google/gemini",
    promptVersion: "3",
    errorCode: null,
    // Written before a pattern existed, or by a path that skipped it: redacted on the way out.
    input: `call me on 01012345678 or ali@example.com, see https://x.test/a ${"x".repeat(5_000)}`,
    output: "fine",
  };

  it("redacts again, and cuts each field in a listing", async () => {
    repo.findRecentTraces.mockResolvedValue([stored]);
    const [trace] = await listRecentTraces({ limit: 999 });
    expect(repo.findRecentTraces).toHaveBeenCalledWith({ limit: OPS_LIMITS.maxTraces });
    expect(trace.input).toMatch(/^call me on \[phone\] or \[email\], see \[link\]/);
    expect(trace.input).not.toMatch(/01012345678|ali@example\.com|x\.test/);
    expect(trace.input.length).toBeLessThanOrEqual(OPS_LIMITS.traceListFieldChars + "…[truncated]".length);
    expect(trace.createdAt).toBe(new Date(NOW).toISOString());
  });

  it("returns one trace whole, still redacted", async () => {
    repo.findTraceById.mockResolvedValue(stored);
    const trace = await getTrace("t1");
    expect(trace.input.length).toBeGreaterThan(OPS_LIMITS.traceListFieldChars);
    expect(trace.input).not.toMatch(/01012345678/);
  });

  it("says not found for an unknown trace", async () => {
    repo.findTraceById.mockResolvedValue(null);
    await expect(getTrace("nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("evaluation reports", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ops-eval-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const call = { feature: "listing_qa", model: "google/gemini", promptVersion: "3", cached: false };
  function write(name: string, outcomes: Record<string, "pass" | "fail" | "inconclusive">, notes: Record<string, string> = {}) {
    const file = path.join(dir, name);
    const report = {
      createdAt: "2026-10-13T03:00:00Z",
      commit: "abc123",
      suites: [
        {
          file: "qa.eval.test.ts",
          suiteCalls: [call],
          cases: Object.entries(outcomes).map(([id, outcome]) => ({ id: `qa.eval.test.ts › ${id}`, outcome, durationMs: 1, note: notes[id], calls: [] })),
        },
      ],
    };
    writeFileSync(file, JSON.stringify(report));
    return file;
  }

  it("summarizes a run, with failure notes redacted", async () => {
    const file = write("latest.json", { a: "pass", b: "fail", c: "inconclusive" }, { b: "model wrote 01012345678" });
    const summary = await summarizeEvalReport(file);
    expect(summary.run).toEqual({ file: "latest.json", createdAt: "2026-10-13T03:00:00Z", commit: "abc123" });
    expect(summary.totals).toEqual({ pass: 1, fail: 1, inconclusive: 1 });
    expect(summary.models).toEqual({ "google/gemini": 1 });
    expect(summary.failed).toEqual([{ id: "qa.eval.test.ts › b", note: "model wrote [phone]" }]);
  });

  it("compares two runs: regressions, fixes, new and missing cases", async () => {
    const previous = write("previous.json", { a: "pass", b: "fail", gone: "pass", still: "fail" });
    const latest = write("latest2.json", { a: "fail", b: "pass", fresh: "pass", still: "fail" });
    const result = await compareEvalRuns(latest, previous);
    expect(result.regressions.map((r) => r.id)).toEqual(["qa.eval.test.ts › a"]);
    expect(result.fixed.ids).toEqual(["qa.eval.test.ts › b"]);
    expect(result.added.ids).toEqual(["qa.eval.test.ts › fresh"]);
    expect(result.missing.ids).toEqual(["qa.eval.test.ts › gone"]);
    expect(result.stillFailing.ids).toEqual(["qa.eval.test.ts › still"]);
  });

  it("refuses a missing file, a directory, non-JSON, the wrong shape and an oversized file", async () => {
    await expect(summarizeEvalReport(path.join(dir, "absent.json"))).rejects.toBeInstanceOf(NotFoundError);
    await expect(summarizeEvalReport(dir)).rejects.toBeInstanceOf(NotFoundError);
    const notJson = path.join(dir, "notjson.json");
    writeFileSync(notJson, "{ nope");
    await expect(summarizeEvalReport(notJson)).rejects.toBeInstanceOf(ValidationError);
    const wrongShape = path.join(dir, "package.json");
    writeFileSync(wrongShape, JSON.stringify({ name: "autome", dependencies: {} }));
    await expect(summarizeEvalReport(wrongShape)).rejects.toThrow("not an evaluation report");
    const huge = path.join(dir, "huge.json");
    writeFileSync(huge, " ".repeat(10 * 1024 * 1024 + 1));
    await expect(summarizeEvalReport(huge)).rejects.toThrow("larger than 10 MB");
  });
});
