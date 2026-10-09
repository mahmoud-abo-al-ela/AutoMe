import { writeFileSync } from "node:fs";
import type { Reporter, TestCase, TestModule } from "vitest/node";
import type { AiCallRecord } from "@/lib/ai/client";
import { allCases, type EvalReport, type ReportedCall, type ReportedCase } from "@/lib/ai/evaluation/report";

/**
 * Writes the evaluation run to AI_EVAL_REPORT (default eval-report.json) for
 * scripts/ai-eval-compare.ts. Used only by vitest.eval.config.mjs.
 *
 * A skipped case with a note is inconclusive — the suites skip with a note
 * when every model in the chain was unavailable. A skip without one is a
 * suite that did not run (AI_EVAL unset) and is left out.
 */

const toCall = (call: AiCallRecord): ReportedCall => ({
  feature: call.feature,
  model: `${call.provider}/${call.model}`,
  promptVersion: call.promptVersion,
  cached: call.cached,
});

/**
 * The error that stopped the suite a case belongs to, if any. A `beforeAll`
 * that throws — where most suites call the model — marks every case under it
 * skipped, without a note; read as "did not run", a broken suite would vanish
 * from the report and the run would pass.
 */
function suiteFailure(test: TestCase): string | null {
  for (let node: TestCase["parent"] | undefined = test.parent; node; ) {
    // The suite's own errors — a hook that threw. Not its state: a suite is
    // "failed" whenever any one of its cases failed.
    const [first] = node.errors();
    if (first) {
      return `suite failed: ${first.message}`;
    }
    node = node.type === "module" ? undefined : node.parent;
  }
  return null;
}

function toCase(file: string, test: TestCase): ReportedCase | null {
  const result = test.result();
  const durationMs = Math.round(test.diagnostic()?.duration ?? 0);
  const calls = (test.meta().aiCalls ?? []).map(toCall);
  const id = `${file} › ${test.fullName}`;

  if (result.state === "passed") return { id, outcome: "pass", durationMs, calls };
  if (result.state === "failed") return { id, outcome: "fail", durationMs, calls };
  if (result.state === "skipped" && result.note) {
    return { id, outcome: "inconclusive", durationMs, note: result.note, calls };
  }
  const broken = result.state === "skipped" ? suiteFailure(test) : null;
  if (broken) return { id, outcome: "fail", durationMs, note: broken, calls };
  return null;
}

export default class EvalReporter implements Reporter {
  onTestRunEnd(modules: ReadonlyArray<TestModule>) {
    const report: EvalReport = {
      createdAt: new Date().toISOString(),
      commit: process.env.GITHUB_SHA ?? null,
      suites: modules.map((module) => {
        const file = module.relativeModuleId.replace(/\\/g, "/");
        return {
          file,
          suiteCalls: (module.meta().aiCalls ?? []).map(toCall),
          cases: [...module.children.allTests()].flatMap((test) => toCase(file, test) ?? []),
        };
      }),
    };

    const path = process.env.AI_EVAL_REPORT || "eval-report.json";
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);

    const cases = allCases(report);
    const count = (outcome: string) => cases.filter((c) => c.outcome === outcome).length;
    console.info(
      `\n[ai-eval] ${count("pass")} passed · ${count("fail")} failed · ${count("inconclusive")} inconclusive → ${path}`
    );
  }
}
