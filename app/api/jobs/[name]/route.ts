import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { isJobName, isValidJobPayload, runJob } from "@/lib/jobs/registry";
import { jobUrl } from "@/lib/jobs/url";
import { logError } from "@/lib/utils/errors";

/**
 * A background job, delivered by Upstash QStash (see lib/jobs).
 *
 * Public to the middleware — no session — so it authenticates itself: the
 * request must carry QStash's signature over this exact URL and body, made
 * with one of our signing keys. Without the keys it refuses (fail closed),
 * never runs unsigned work.
 *
 * Status codes drive the queue: 2xx is done; anything else is retried with
 * backoff. So a failed run answers 500 — that is how an "AI busy" becomes a
 * retry — and a request the queue did not sign answers 401. A signed job that
 * can never succeed — an unknown name, an unreadable body, a payload its
 * schema refuses — answers 489 with Upstash-NonRetryable-Error, QStash's
 * signal to stop retrying and move it to the dead-letter queue, where it can
 * be inspected rather than delivered three more times.
 */

/** QStash's "do not retry this one" answer. */
function nonRetryable(error: string) {
  return NextResponse.json({ error }, { status: 489, headers: { "Upstash-NonRetryable-Error": "true" } });
}

export const runtime = "nodejs";
/** Long enough for a vision call; needs Fluid compute, like the AI routes. */
export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    logError("QStash signing keys are not configured; refusing background job");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { name } = await params;
  const body = await request.text();
  const signature = request.headers.get("upstash-signature");
  if (!signature) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Over the URL too, so a signed job cannot be replayed at another job —
    // the URL lib/jobs published to, which is what QStash signed; the URL a
    // request arrives on can differ by host behind the platform's proxy.
    const valid = await new Receiver({ currentSigningKey, nextSigningKey }).verify({
      signature,
      body,
      url: jobUrl(name) ?? request.url,
      clockTolerance: 5,
    });
    if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isJobName(name)) {
    logError(`Background job "${name}" is not one this deploy runs; not retried`);
    return nonRetryable("Unknown job");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    logError(`Background job ${name} arrived with an unreadable body; not retried`);
    return nonRetryable("Invalid body");
  }
  if (!isValidJobPayload(name, payload)) {
    logError(`Background job ${name} arrived with a payload its schema refuses; not retried`);
    return nonRetryable("Invalid payload");
  }

  try {
    await runJob(name, payload);
    return NextResponse.json({ done: true });
  } catch (error) {
    logError(`Background job ${name} failed; the queue will retry it`, error);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
