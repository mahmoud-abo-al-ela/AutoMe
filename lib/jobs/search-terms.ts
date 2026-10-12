import { createHash } from "node:crypto";
import { enqueue, type EnqueueOptions } from "@/lib/jobs";
import { jobUrl } from "@/lib/jobs/url";
import { logError } from "@/lib/utils/errors";

/**
 * Refreshing the search's vocabulary after a change, without one refresh per
 * save. Changes are grouped into windows: every change in a window asks for
 * the same job — one deduplication id per window — delivered just after the
 * window closes, so it reads every change made in it. A save that lands while
 * an earlier window's refresh is still waiting simply joins its own window.
 *
 * The id carries the deployment's job URL, hashed: a preview and production
 * can share one QStash account, and a preview's save must not stand in for
 * production's refresh.
 *
 * Best effort by design: if every retry of a window's job fails, the daily
 * cron (app/api/cron/refresh-search-terms) catches up. Exact search never
 * reads the vocabulary, so a late refresh only delays a typo correction.
 */

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

/**
 * Say that cars' words or visibility changed — a car saved, deleted or bulk
 * edited, a dealership suspended, activated or deleted. Call it after the
 * change is committed. Never throws: the change has happened, and a missed
 * refresh is caught up daily.
 */
export async function searchTermsChanged(now: number = Date.now()): Promise<void> {
  const url = jobUrl("search-terms");
  try {
    // Without a URL there is no queue: the job runs after the response, once per change.
    await enqueue("search-terms", {}, url ? searchTermsSchedule(now, url) : {});
  } catch (error) {
    logError("Could not schedule a search vocabulary refresh; the daily one will catch up", error);
  }
}
