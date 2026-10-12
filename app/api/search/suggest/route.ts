import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceSuggestLimit } from "@/lib/middleware/with-rate-limit";
import { suggestSearches } from "@/lib/services/car/search-suggestions";
import { RateLimitError, ServiceUnavailableError, logError } from "@/lib/utils/errors";
import { MAX_SUGGEST_QUERY } from "@/lib/search/suggest";

/**
 * Search suggestions as a buyer types: GET /api/search/suggest?q=…&locale=…
 *
 * Public, and the same for everyone: public listings only, no session, no
 * cookie, no tenant — it takes no parameter but the text and the language.
 * That is what makes it safe for a CDN to share an answer between buyers,
 * for a minute. A refusal or a failure is never shared.
 *
 * Rate-limited on its own bucket (enforceSuggestLimit), before anything else.
 */

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(1).max(MAX_SUGGEST_QUERY),
  locale: z.enum(["en", "ar"]).default("en"),
});

const SHARED = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
const NEVER = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    await enforceSuggestLimit();
  } catch (error) {
    if (error instanceof RateLimitError) {
      const headers: Record<string, string> = { ...NEVER };
      if (error.retryAfter) headers["Retry-After"] = String(error.retryAfter);
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
    }
    if (!(error instanceof ServiceUnavailableError)) logError("Search suggestions: rate limit check failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: NEVER });
  }

  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    q: params.get("q") ?? undefined,
    locale: params.get("locale") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: NEVER });
  }

  try {
    const suggestions = await suggestSearches(parsed.data.q, parsed.data.locale);
    return NextResponse.json({ suggestions }, { headers: SHARED });
  } catch (error) {
    logError("Search suggestions failed", error);
    return NextResponse.json({ error: "Suggestions unavailable" }, { status: 500, headers: NEVER });
  }
}
