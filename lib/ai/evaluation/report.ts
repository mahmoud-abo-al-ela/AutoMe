/**
 * The evaluation report: what one run of the real-model suites found, and how
 * it compares with the committed baseline. Pure — the reporter writes it, the
 * compare script reads it, and both are tested without a model.
 */

export type CaseOutcome = "pass" | "fail" | "inconclusive";

export interface ReportedCall {
  feature: string;
  /** "provider/model". */
  model: string;
  promptVersion: string;
  cached: boolean;
}

export interface ReportedCase {
  /** "<suite file> › <full test name>" — stable across runs, so it is the key. */
  id: string;
  outcome: CaseOutcome;
  durationMs: number;
  /** Why it was inconclusive: every model in the chain was unavailable. */
  note?: string;
  /** Calls the case made itself; most suites call in beforeAll, see `suiteCalls`. */
  calls: ReportedCall[];
}

export interface ReportedSuite {
  file: string;
  /** Calls made in the suite's beforeAll hooks, shared by its cases. */
  suiteCalls: ReportedCall[];
  cases: ReportedCase[];
}

export interface EvalReport {
  createdAt: string;
  commit: string | null;
  suites: ReportedSuite[];
}

/** The baseline is a case's last conclusive outcome. */
export interface EvalBaseline {
  updatedAt: string;
  cases: Record<string, "pass" | "fail">;
}

/**
 * A case a second model judged (see judge.ts). Reported, never a reason to fail
 * a run: a judge is noisier than an assertion.
 */
export const ADVISORY_MARK = "[judge]";
export const isAdvisory = (id: string) => id.includes(ADVISORY_MARK);

export interface Comparison {
  /** Passed in the baseline, failed now — the only thing that fails a run. */
  regressions: string[];
  /**
   * In the baseline, in a suite this run executed, but absent from it — a
   * renamed, deleted or no-longer-collected case. Fails the run, like a
   * regression, until the baseline is updated to accept it.
   */
  missing: string[];
  /** Advisory cases that failed this run — what the judge disagreed with. */
  advisoryFailures: string[];
  /** Failed in the baseline, pass now. */
  fixed: string[];
  /** Conclusive now, absent from the baseline. */
  added: string[];
  /** Inconclusive this run: no model answered. Reported, never a failure. */
  inconclusive: string[];
  totals: Record<CaseOutcome, number>;
}

export function allCases(report: EvalReport): ReportedCase[] {
  return report.suites.flatMap((suite) => suite.cases);
}

export function compareToBaseline(report: EvalReport, baseline: EvalBaseline | null): Comparison {
  const comparison: Comparison = {
    regressions: [],
    missing: [],
    advisoryFailures: [],
    fixed: [],
    added: [],
    inconclusive: [],
    totals: { pass: 0, fail: 0, inconclusive: 0 },
  };

  for (const { id, outcome } of allCases(report)) {
    comparison.totals[outcome]++;
    if (outcome === "inconclusive") {
      comparison.inconclusive.push(id);
      continue;
    }
    if (isAdvisory(id) && outcome === "fail") comparison.advisoryFailures.push(id);
    const before = baseline?.cases[id];
    if (!before) comparison.added.push(id);
    else if (before === "pass" && outcome === "fail" && !isAdvisory(id)) comparison.regressions.push(id);
    else if (before === "fail" && outcome === "pass") comparison.fixed.push(id);
  }
  comparison.missing = missingFromRun(report, baseline).filter((id) => !isAdvisory(id));
  return comparison;
}

/** The suite file a case id belongs to — see ReportedCase.id. */
const fileOf = (id: string) => id.split(" › ")[0];

/** Baseline cases from the suites this run executed that the run did not report. */
function missingFromRun(report: EvalReport, baseline: EvalBaseline | null): string[] {
  if (!baseline) return [];
  const ran = new Set(report.suites.map((suite) => suite.file));
  const reported = new Set(allCases(report).map((c) => c.id));
  return Object.keys(baseline.cases).filter((id) => ran.has(fileOf(id)) && !reported.has(id));
}

/**
 * The baseline after accepting a run: conclusive outcomes replace what was
 * there, and a case this run could not judge keeps its last verdict.
 */
export function nextBaseline(report: EvalReport, previous: EvalBaseline | null, now = new Date()): EvalBaseline {
  const cases: EvalBaseline["cases"] = { ...(previous?.cases ?? {}) };
  // Accepting a run accepts what it no longer has, too.
  for (const id of missingFromRun(report, previous)) delete cases[id];
  for (const { id, outcome } of allCases(report)) {
    if (outcome !== "inconclusive") cases[id] = outcome;
  }
  const sorted = Object.fromEntries(Object.entries(cases).sort(([a], [b]) => a.localeCompare(b)));
  return { updatedAt: now.toISOString(), cases: sorted };
}

/** How often each model answered, across a run — to read results in context. */
export function modelMix(report: EvalReport): Record<string, number> {
  const mix: Record<string, number> = {};
  for (const suite of report.suites) {
    for (const call of [...suite.suiteCalls, ...suite.cases.flatMap((c) => c.calls)]) {
      if (call.cached) continue;
      mix[call.model] = (mix[call.model] ?? 0) + 1;
    }
  }
  return mix;
}
