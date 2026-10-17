import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  allCases,
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

const notes = new Map(allCases(report).map((c) => [c.id, c.note]));

/** Each case on a line; with `withNotes`, why it failed on the line under it. */
const list = (title: string, ids: string[], { withNotes = false } = {}) => {
  if (ids.length === 0) return;
  console.info(`\n${title} (${ids.length})`);
  for (const id of ids) {
    console.info(`  - ${id}`);
    const note = withNotes ? notes.get(id) : undefined;
    if (note) console.info(`      ${note}`);
  }
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
list("Failed this run", result.failed, { withNotes: true });
list("Judge disagreements — advisory, never fail the run", result.advisoryFailures, { withNotes: true });
list("Fixed — failed in the baseline, pass now", result.fixed);
list("New cases", result.added);
list("Inconclusive — no model answered", result.inconclusive);

if (process.argv.includes("--update-baseline")) {
  writeFileSync(baselinePath, `${JSON.stringify(nextBaseline(report, baseline), null, 2)}\n`);
  console.info(`\nBaseline updated: ${baselinePath}`);
  process.exit(0);
}

// With no baseline there is nothing to regress from, and a gate that cannot
// fail is no gate: the nightly run stayed green whatever got worse. Fail until
// a baseline is committed, and say how.
if (!baseline) {
  console.error(
    `\nNo baseline at ${baselinePath}, so this run cannot catch a regression.\n` +
      "Accept a run you have reviewed as the baseline:\n" +
      "  1. download its eval-report artifact (Actions → AI evaluation → the run)\n" +
      "  2. AI_EVAL_REPORT=eval-report.json pnpm eval:compare --update-baseline\n" +
      `  3. commit ${baselinePath}`
  );
  process.exit(1);
}

process.exit(result.regressions.length > 0 || result.missing.length > 0 ? 1 : 0);
