import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { aiCallerFor } from "@/lib/ai/caller";
import type { AiProgressEvent } from "@/lib/ai/client";
import {
  CAR_LISTING_FIELDS,
  countWrittenFields,
  extractCarListing,
  prepareImage,
} from "@/lib/services/ai";
import { createErrorResponse } from "@/lib/utils/response";
import { AppError, logError } from "@/lib/utils/errors";
import type { CarListingStreamEvent } from "./events";

/**
 * Extract a car listing from a dealer's photo, streaming real progress.
 *
 * Replaces the `processCarImageGated` server action, which could only answer
 * once — so the upload screen showed a fixed bar for however long Google took.
 * Every event on this stream is something that actually happened: a request
 * sent to a model, a model busy and the next one tried, a field of the reply
 * written. Nothing is estimated.
 *
 * All gates run BEFORE the stream opens, so a refusal is a real HTTP status
 * (401/403/400/429/402-style plan errors) rather than an error inside a 200.
 * Only what can fail after the provider call starts arrives as a stream event.
 */

export const runtime = "nodejs";

/**
 * Google's free tier was measured queueing requests 75–131 s before the first
 * byte (2026-09-24), so the platform ceiling is set to the most Vercel allows.
 *
 * ⚠️ 300 needs Fluid compute (the default for projects created since 2025).
 * Without it a Hobby project caps at 60 and the deploy FAILS on this value —
 * check Project Settings → Functions before deploying.
 */
export const maxDuration = 300;

/**
 * The AI budget sits under maxDuration with room for the upload and response:
 * a platform kill skips the metering `finally` and loses the ledger row.
 * Per attempt it is the whole budget, because a queued request is slow to
 * START, not broken — cutting it at 20 s just throws the place in line away.
 * A busy model still fails fast (503) and the chain moves on.
 */
const AI_BUDGET_MS = 280_000;

/**
 * A Flash model that has not started answering in 45 s is queued, and the
 * chain moves on — down to Gemma 4 if need be — instead of spending the whole
 * budget in one queue. Busy models answer 503 in seconds; a model that starts
 * writes the whole reply in about one more.
 */
const FIRST_TOKEN_MS = 45_000;

/** Keeps proxies from closing a connection that is silent while Google queues it. */
const HEARTBEAT_MS = 15_000;

/** Plan enables AI and there is quota left — the same gates the action had. */
const assertAiAllowed = withPlanGate(
  "aiProcessing",
  withUsageLimit("aiProcessing", async () => undefined)
);

function errorStatus(error: unknown): number {
  return error instanceof AppError ? error.statusCode : 500;
}

export async function POST(request: Request) {
  let ctx;
  let image;
  try {
    ctx = await resolveTenantContext();
    await assertAiAllowed(ctx);
    await enforceRateLimit();

    const formData = await request.formData();
    // File | string | null. prepareImage refuses anything that is not a File,
    // caps the size, and checks the type AND the bytes' real signature.
    image = await prepareImage(formData.get("file") as File);
  } catch (error) {
    if (!(error instanceof AppError)) logError("AI car listing refused", error);
    return NextResponse.json(createErrorResponse(error), { status: errorStatus(error) });
  }

  const caller = aiCallerFor(ctx);
  const preparedImage = image;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: CarListingStreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The dealer left. The call runs on and is still metered; there is
          // just nobody to tell.
          open = false;
        }
      };

      const heartbeat = setInterval(() => send({ type: "heartbeat" }), HEARTBEAT_MS);
      let lastFields = -1;

      const onProgress = (event: AiProgressEvent) => {
        if (event.type === "text") {
          const done = countWrittenFields(event.text);
          if (done !== lastFields) {
            lastFields = done;
            send({ type: "fields", done, total: CAR_LISTING_FIELDS.length });
          }
          return;
        }
        if (event.type === "attempt") {
          lastFields = -1;
          send({
            type: "attempt",
            modelIndex: event.modelIndex,
            modelCount: event.modelCount,
            retry: event.retry,
          });
          return;
        }
        send({ type: "cached" });
      };

      try {
        const draft = await extractCarListing(preparedImage, caller, {
          onProgress,
          timeoutMs: AI_BUDGET_MS,
          budgetMs: AI_BUDGET_MS,
          firstTokenTimeoutMs: FIRST_TOKEN_MS,
        });
        send({ type: "result", data: draft });
      } catch (error) {
        if (!(error instanceof AppError)) logError("AI car listing failed", error);
        send({ type: "error", error: createErrorResponse(error).error });
      } finally {
        clearInterval(heartbeat);
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Stops nginx-style proxies buffering the stream into one late reply.
      "X-Accel-Buffering": "no",
    },
  });
}
