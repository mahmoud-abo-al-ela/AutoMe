import { after } from "next/server";
import { Client } from "@upstash/qstash";
import { runJob, JOBS, type JobName, type JobPayload } from "@/lib/jobs/registry";
import { jobUrl } from "@/lib/jobs/url";
import { logError } from "@/lib/utils/errors";
import { reportSignal } from "@/lib/observability/report";

/**
 * Background work that must not be lost: a job is handed to Upstash QStash,
 * which calls /api/jobs/<name> and retries with backoff until it succeeds —
 * where `after()` gets one try inside the function that queued it, and a
 * failure (an "AI busy", a timeout) is simply gone.
 *
 * Without QStash configured — local development, CI, a deploy before the
 * variables are added — on a host QStash cannot reach, or when it does not
 * answer, the job runs after the response exactly as before, so nothing
 * depends on the queue to work.
 */

const RETRIES = 3;
/** Queueing sits in front of the caller's response; a slow queue is a down one. */
const PUBLISH_TIMEOUT_MS = 2_000;

let client: Client | null | undefined;

function qstash(): Client | null {
  if (client !== undefined) return client;
  client = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;
  return client;
}

/**
 * Run the job once the response is sent — or now, where there is no response
 * to wait for (a script, a test): `after()` only exists inside a request.
 */
async function runWithoutQueue<N extends JobName>(name: N, payload: JobPayload<N>): Promise<void> {
  const run = () =>
    runJob(name, payload).catch((error) => {
      // Tagged as the queued path is (app/api/jobs/[name]), so one alert sees both.
      void reportSignal({ name: "job.failed", level: "error", tags: { job: name, path: "after" }, groupBy: name, error });
      logError(`Job ${name} failed`, error);
    });
  try {
    after(run);
  } catch {
    await run();
  }
}

/** How QStash should deliver one job; ignored when the job runs without the queue. */
export interface EnqueueOptions {
  /** A second job with the same id is accepted but not queued (QStash keeps ids for 90 days). */
  deduplicationId?: string;
  /** Deliver no earlier than this — Unix time in seconds. */
  notBefore?: number;
}

/**
 * Queue a job. The payload is validated now, so a bad one fails where it was
 * written, not minutes later in the queue.
 */
export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayload<N>,
  options: EnqueueOptions = {}
): Promise<void> {
  const body = JOBS[name].schema.parse(payload) as JobPayload<N>;
  const queue = qstash();
  const url = jobUrl(name);
  if (!queue || !url) return runWithoutQueue(name, body);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      queue.publishJSON({ url, body, retries: RETRIES, ...options }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("QStash publish timed out")), PUBLISH_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    // Do the work the old way rather than drop it. If a slow publish did land,
    // the job runs twice — every job is idempotent, so that only costs a call.
    logError(`Could not queue job ${name}; running it after the response`, error);
    await runWithoutQueue(name, body);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Test seam: forget the client, so a test can change the environment. */
export function resetJobsForTests(): void {
  client = undefined;
}
