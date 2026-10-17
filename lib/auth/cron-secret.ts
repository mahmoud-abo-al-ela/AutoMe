import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { logError } from "@/lib/utils/errors";

/** Constant-time: a cron endpoint is public and can be hammered. */
function secretMatches(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Fails closed: with no CRON_SECRET configured nobody may run the job.
export function refuseCronRequest(request: Request, job: string): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logError(`CRON_SECRET is not configured; refusing ${job}`);
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
