/**
 * Compare an evaluation run with the committed baseline.
 *
 *   pnpm eval:compare                    # eval-report.json vs the baseline
 *   pnpm eval:compare --update-baseline  # accept this run as the new baseline
 *
 * Exits 1 on a regression — a case that passed in the baseline and fails now —
 * or a baseline case a suite that ran no longer reports. A case no model could answer is inconclusive and never fails the run —
 * a quota-starved night is not a quality regression. Paths can be overridden
 * with AI_EVAL_REPORT and AI_EVAL_BASELINE.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  compareToBaseline,
  modelMix,
  nextBaseline,
  type EvalBaseline,
  type EvalReport,
} from "../lib/ai/evaluation/report";

const reportPath = process.env.AI_EVAL_REPORT || "eval-report.json";
const baselinePath = process.env.AI_EVAL_BASELINE || "lib/ai/evaluation/baseline.json";

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

if (!existsSync(reportPath)) {
  console.error(`No report at ${reportPath}. Run \`AI_EVAL=1 pnpm eval\` first.`);
  process.exit(2);
}

const report = readJson<EvalReport>(reportPath);
const baseline = existsSync(baselinePath) ? readJson<EvalBaseline>(baselinePath) : null;
const result = compareToBaseline(report, baseline);

const list = (title: string, ids: string[]) => {
  if (ids.length === 0) return;
  console.info(`\n${title} (${ids.length})`);
  for (const id of ids) console.info(`  - ${id}`);
};

console.info(
  `Evaluation: ${result.totals.pass} pass · ${result.totals.fail} fail · ${result.totals.inconclusive} inconclusive` +
    (baseline ? ` — against the baseline of ${baseline.updatedAt}` : " — no baseline yet")
);
console.info(
  "Models that answered:",
  Object.entries(modelMix(report))
    .sort(([, a], [, b]) => b - a)
    .map(([model, n]) => `${model} ×${n}`)
    .join(", ") || "none"
);
list("REGRESSIONS — passed in the baseline, fail now", result.regressions);
list("MISSING — in the baseline, not in this run (renamed, deleted or not collected)", result.missing);
list("Judge disagreements — advisory, never fail the run", result.advisoryFailures);
list("Fixed — failed in the baseline, pass now", result.fixed);
list("New cases", result.added);
list("Inconclusive — no model answered", result.inconclusive);

if (process.argv.includes("--update-baseline")) {
  writeFileSync(baselinePath, `${JSON.stringify(nextBaseline(report, baseline), null, 2)}\n`);
  console.info(`\nBaseline updated: ${baselinePath}`);
  process.exit(0);
}

process.exit(result.regressions.length > 0 || result.missing.length > 0 ? 1 : 0);
