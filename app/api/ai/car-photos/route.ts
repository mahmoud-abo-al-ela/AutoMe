import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth";
import { enforceDealerAiLimit } from "@/lib/middleware/with-rate-limit";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { aiCallerFor } from "@/lib/ai/caller";
import { groupCarPhotos, prepareImage } from "@/lib/services/ai";
import { MAX_IMPORT_PHOTOS } from "@/lib/constants/car-options";
import { createErrorResponse } from "@/lib/utils/response";
import { AppError, ValidationError, logError } from "@/lib/utils/errors";

/**
 * Sort a bulk import's photos into cars — the first step of an import.
 *
 * The browser sends small copies of the photos (it keeps the originals for
 * the listings). Each car found is then read and saved one at a time through
 * the usual listing path, which is where the allowance is spent; this call
 * is metered but counts as no listing.
 *
 * Same gates as a listing read, all before any model call: a plan with AI and
 * listings left this month, then the rate limit.
 */

export const runtime = "nodejs";
/** One vision call on the fast chain; the free tier queues. Needs Fluid compute. */
export const maxDuration = 300;

const assertAiAllowed = withPlanGate(
  "aiProcessing",
  withUsageLimit("aiProcessing", async () => undefined)
);

export async function POST(request: Request) {
  try {
    const ctx = await resolveTenantContext();
    await assertAiAllowed(ctx);
    await enforceDealerAiLimit();

    const files = (await request.formData()).getAll("file");
    if (files.length > MAX_IMPORT_PHOTOS) {
      throw new ValidationError(`At most ${MAX_IMPORT_PHOTOS} photos`, "file", {
        key: "errors.ai.tooManyImages",
        params: { max: MAX_IMPORT_PHOTOS },
      });
    }
    // None at all is refused by prepareImage as no image.
    const images = await Promise.all(
      (files.length > 0 ? files : [null]).map((file) => prepareImage(file as File))
    );

    const groups = await groupCarPhotos(images, aiCallerFor(ctx));
    return NextResponse.json({ success: true, data: { groups } });
  } catch (error) {
    if (!(error instanceof AppError)) logError("Grouping import photos failed", error);
    const status = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(createErrorResponse(error), { status });
  }
}
