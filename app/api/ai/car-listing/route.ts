import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth";
import { authorizeDealerAiFeature } from "@/lib/services/ai/authorize";
import { AI_FEATURES } from "@/lib/ai/features";
import type { AiCallerContext } from "@/lib/ai/client";
import { assertUnsavedReadsLeft } from "@/lib/services/car/ai-allowance";
import type { AiProgressEvent } from "@/lib/ai/client";
import {
  CAR_LISTING_FIELDS,
  countWrittenFields,
  extractCarListing,
  MAX_LISTING_PHOTOS,
  prepareImage,
} from "@/lib/services/ai";
import { createErrorResponse } from "@/lib/utils/response";
import { AppError, ValidationError, logError } from "@/lib/utils/errors";
import type { CarListingStreamEvent } from "./events";

export const runtime = "nodejs";

export const maxDuration = 300;

const AI_BUDGET_MS = 280_000;

const FIRST_TOKEN_MS = 45_000;

/** Keeps proxies from closing a connection that is silent while Google queues it. */
const HEARTBEAT_MS = 15_000;

function errorStatus(error: unknown): number {
  return error instanceof AppError ? error.statusCode : 500;
}

export async function POST(request: Request) {
  let ctx;
  let caller: AiCallerContext;
  let images;
  try {
    // The dashboard passes its dealership: this URL (/api/…) names none.
    // Selection only — resolveTenantContext still requires a membership.
    ctx = await resolveTenantContext({
      organizationSlug: new URL(request.url).searchParams.get("org"),
    });
    // The plan in effect has AI, this month's allowance has room, the
    // dealer-AI rate limit — and who the call is billed to, at what priority.
    caller = await authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage);
    // A read never saved costs no listing, so it has its own cap.
    await assertUnsavedReadsLeft(ctx);

    const formData = await request.formData();
    const files = formData.getAll("file");
    if (files.length > MAX_LISTING_PHOTOS) {
      throw new ValidationError(`At most ${MAX_LISTING_PHOTOS} photos`, "file", {
        key: "errors.ai.tooManyImages",
        params: { max: MAX_LISTING_PHOTOS },
      });
    }
    // File | string entries. prepareImage refuses anything that is not a File,
    // caps the size, and checks the type AND the bytes' real signature — and
    // none at all is refused as no image.
    images = await Promise.all(
      (files.length > 0 ? files : [null]).map((file) => prepareImage(file as File))
    );
  } catch (error) {
    if (!(error instanceof AppError)) logError("AI car listing refused", error);
    return NextResponse.json(createErrorResponse(error), { status: errorStatus(error) });
  }

  const preparedImages = images;
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
        const draft = await extractCarListing(preparedImages, caller, {
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
