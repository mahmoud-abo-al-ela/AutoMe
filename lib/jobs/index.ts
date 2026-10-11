import { after } from "next/server";
import { Client } from "@upstash/qstash";
import { runJob, JOBS, type JobName, type JobPayload } from "@/lib/jobs/registry";
import { logError } from "@/lib/utils/errors";

/**
 * Background work that must not be lost: a job is handed to Upstash QStash,
 * which calls /api/jobs/<name> and retries with backoff until it succeeds —
 * where `after()` gets one try inside the function that queued it, and a
 * failure (an "AI busy", a timeout) is simply gone.
 *
 * Without QStash configured — local development, CI, a deploy before the
 * variables are added — or on a host QStash cannot reach, the job runs in
 * `after()` exactly as before, so nothing depends on the queue to work.
 */

const RETRIES = 3;

let client: Client | null | undefined;

function qstash(): Client | null {
  if (client !== undefined) return client;
  client = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;
  return client;
}

/** Where QStash delivers; null when it could not reach us (a local URL). */
function deliveryBase(): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return null;
  try {
    const { hostname } = new URL(base);
    return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1" ? null : base;
  } catch {
    return null;
  }
}

function runAfter<N extends JobName>(name: N, payload: JobPayload<N>) {
  after(() => runJob(name, payload).catch((error) => logError(`Job ${name} failed`, error)));
}

/**
 * Queue a job. Call it from a server action or route handler — the fallback
 * runs in that request's `after()`. The payload is validated now, so a bad
 * one fails where it was written, not minutes later in the queue.
 */
export async function enqueue<N extends JobName>(name: N, payload: JobPayload<N>): Promise<void> {
  const body = JOBS[name].schema.parse(payload) as JobPayload<N>;
  const queue = qstash();
  const base = deliveryBase();
  if (!queue || !base) return runAfter(name, body);

  try {
    await queue.publishJSON({ url: `${base}/api/jobs/${name}`, body, retries: RETRIES });
  } catch (error) {
    // The queue is down: do the work the old way rather than drop it.
    logError(`Could not queue job ${name}; running it after the response`, error);
    runAfter(name, body);
  }
}

/** Test seam: forget the client, so a test can change the environment. */
export function resetJobsForTests(): void {
  client = undefined;
}
