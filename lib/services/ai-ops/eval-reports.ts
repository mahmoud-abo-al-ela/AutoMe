import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { redactText } from "@/lib/ai/redact";
import {
  allCases,
  compareToBaseline,
  modelMix,
  nextBaseline,
  type EvalReport,
} from "@/lib/ai/evaluation/report";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

/**
 * The nightly evaluation's reports (eval-report.json, downloaded from the
 * workflow run) for an operator: one run summarized, or two compared. The
 * files are the ones the server was configured with — a caller names no
 * path, so these reads can never be pointed anywhere else on the machine.
 */

const MAX_REPORT_BYTES = 10 * 1024 * 1024;
/** Per list, and per failure note: a report of a bad night stays readable. */
const MAX_LISTED = 100;
const MAX_NOTE_CHARS = 500;

const callSchema = z.object({ feature: z.string(), model: z.string(), promptVersion: z.string(), cached: z.boolean() });
const reportSchema = z.object({
  createdAt: z.string(),
  commit: z.string().nullable(),
  suites: z.array(
    z.object({
      file: z.string(),
      suiteCalls: z.array(callSchema),
      cases: z.array(
        z.object({
          id: z.string(),
          outcome: z.enum(["pass", "fail", "inconclusive"]),
          durationMs: z.number(),
          note: z.string().optional(),
          calls: z.array(callSchema),
        })
      ),
    })
  ),
});

export async function readEvalReport(file: string): Promise<EvalReport> {
  const size = await stat(file).then(
    (info) => (info.isFile() ? info.size : -1),
    () => -1
  );
  if (size < 0) throw new NotFoundError("Evaluation report");
  if (size > MAX_REPORT_BYTES) throw new ValidationError("The evaluation report is larger than 10 MB");
  let json: unknown;
  try {
    json = JSON.parse(await readFile(file, "utf8"));
  } catch {
    throw new ValidationError("The evaluation report is not JSON");
  }
  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) throw new ValidationError("The file is not an evaluation report");
  return parsed.data;
}

const listed = (ids: string[]) => ({ count: ids.length, ids: ids.slice(0, MAX_LISTED) });

function withNotes(report: EvalReport, ids: string[]) {
  const notes = new Map(allCases(report).map((c) => [c.id, c.note]));
  return ids.slice(0, MAX_LISTED).map((id) => {
    const note = notes.get(id);
    // A failure note quotes what the model wrote: redacted like a trace.
    return { id, note: note ? redactText(note).slice(0, MAX_NOTE_CHARS) : null };
  });
}

const runOf = (report: EvalReport, file: string) => ({
  file: path.basename(file),
  createdAt: report.createdAt,
  commit: report.commit,
});

export async function summarizeEvalReport(file: string) {
  const report = await readEvalReport(file);
  const result = compareToBaseline(report, null);
  return {
    run: runOf(report, file),
    totals: result.totals,
    models: modelMix(report),
    failed: withNotes(report, result.failed),
    failedCount: result.failed.length,
    advisoryFailures: withNotes(report, result.advisoryFailures),
    inconclusive: listed(result.inconclusive),
  };
}

/** The latest run against the previous one, as if the previous run were the baseline. */
export async function compareEvalRuns(latestFile: string, previousFile: string) {
  const [latest, previous] = await Promise.all([readEvalReport(latestFile), readEvalReport(previousFile)]);
  const result = compareToBaseline(latest, nextBaseline(previous, null));
  return {
    latest: runOf(latest, latestFile),
    previous: runOf(previous, previousFile),
    totals: result.totals,
    regressions: withNotes(latest, result.regressions),
    regressionCount: result.regressions.length,
    missing: listed(result.missing),
    fixed: listed(result.fixed),
    added: listed(result.added),
    stillFailing: listed(result.failed.filter((id) => !result.regressions.includes(id))),
    inconclusive: listed(result.inconclusive),
  };
}
