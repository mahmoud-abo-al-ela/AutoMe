import { describe, it, expect } from "vitest";
import { compareToBaseline, modelMix, nextBaseline, type EvalReport, type ReportedCase } from "@/lib/ai/evaluation/report";

const call = (model: string, cached = false) => ({ feature: "listingQA", model, promptVersion: "v1", cached });

function report(cases: Partial<ReportedCase>[], suiteCalls = [call("google/flash")]): EvalReport {
  return {
    createdAt: "2026-10-10T01:00:00.000Z",
    commit: null,
    suites: [
      {
        file: "lib/ai/evaluation/listing-qa.eval.test.ts",
        suiteCalls,
        cases: cases.map((c) => ({ id: "x", outcome: "pass", durationMs: 1, calls: [], ...c }) as ReportedCase),
      },
    ],
  };
}

describe("compareToBaseline", () => {
  it("calls a case that passed before and fails now a regression — and nothing else", () => {
    const run = report([
      { id: "a", outcome: "fail" },
      { id: "b", outcome: "pass" },
      { id: "c", outcome: "pass" },
      { id: "d", outcome: "fail" },
    ]);
    const result = compareToBaseline(run, { updatedAt: "", cases: { a: "pass", b: "fail", c: "pass" } });

    expect(result.regressions).toEqual(["a"]);
    expect(result.fixed).toEqual(["b"]);
    expect(result.added).toEqual(["d"]);
    expect(result.totals).toEqual({ pass: 2, fail: 2, inconclusive: 0 });
  });

  it("never treats an unanswered case as a regression", () => {
    const run = report([{ id: "a", outcome: "inconclusive", note: "every model in the chain was unavailable" }]);
    const result = compareToBaseline(run, { updatedAt: "", cases: { a: "pass" } });

    expect(result.regressions).toEqual([]);
    expect(result.inconclusive).toEqual(["a"]);
  });

  it("treats every conclusive case as new when there is no baseline yet", () => {
    const result = compareToBaseline(report([{ id: "a", outcome: "fail" }]), null);
    expect(result).toMatchObject({ regressions: [], added: ["a"] });
  });
});

describe("nextBaseline", () => {
  it("takes this run's verdicts and keeps the last one for a case it could not judge", () => {
    const run = report([
      { id: "b", outcome: "fail" },
      { id: "a", outcome: "inconclusive" },
      { id: "c", outcome: "pass" },
    ]);
    const next = nextBaseline(run, { updatedAt: "", cases: { a: "pass", b: "pass" } }, new Date("2026-10-10T00:00:00Z"));

    expect(next).toEqual({ updatedAt: "2026-10-10T00:00:00.000Z", cases: { a: "pass", b: "fail", c: "pass" } });
    expect(Object.keys(next.cases)).toEqual(["a", "b", "c"]);
  });
});

describe("modelMix", () => {
  it("counts the models that answered, suite and case calls alike, but not cache hits", () => {
    const run = report(
      [{ id: "a", calls: [call("google/flash"), call("codecraft/gpt"), call("codecraft/gpt", true)] }],
      [call("google/flash")]
    );
    expect(modelMix(run)).toEqual({ "google/flash": 2, "codecraft/gpt": 1 });
  });
});
