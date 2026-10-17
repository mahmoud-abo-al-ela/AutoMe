import { createHash } from "node:crypto";
import { enqueue, type EnqueueOptions } from "@/lib/jobs";
import { jobUrl } from "@/lib/jobs/url";
import { logError } from "@/lib/utils/errors";

/** One refresh per this many seconds of changes, at most. */
export const SEARCH_TERMS_WINDOW_SECONDS = 300;
/** Delivered this long after the window ends, for clocks that disagree. */
const CLOCK_SKEW_SECONDS = 30;

/** The deduplication id and delivery time for a change made at `nowMs`. */
export function searchTermsSchedule(nowMs: number, url: string): Required<EnqueueOptions> {
  const window = Math.floor(nowMs / 1000 / SEARCH_TERMS_WINDOW_SECONDS);
  const deployment = createHash("sha256").update(url).digest("hex").slice(0, 16);
  return {
    deduplicationId: `search-terms-${deployment}-${window}`,
    notBefore: (window + 1) * SEARCH_TERMS_WINDOW_SECONDS + CLOCK_SKEW_SECONDS,
  };
}

export async function searchTermsChanged(now: number = Date.now()): Promise<void> {
  const url = jobUrl("search-terms");
  try {
    // Without a URL there is no queue: the job runs after the response, once per change.
    await enqueue("search-terms", {}, url ? searchTermsSchedule(now, url) : {});
  } catch (error) {
    logError("Could not schedule a search vocabulary refresh; the daily one will catch up", error);
  }
}
