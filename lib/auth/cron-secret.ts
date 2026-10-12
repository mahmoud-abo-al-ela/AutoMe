import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { logError } from "@/lib/utils/errors";

/** Constant-time: a cron endpoint is public and can be hammered. */
function secretMatches(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * The guard every cron route runs first: `Authorization: Bearer $CRON_SECRET`
 * (what Vercel Cron sends). Returns the refusal to send, or null to go on.
 *
 * Fails closed — with no secret configured nobody may run the job, rather
 * than everybody (an unset secret once let anyone delete audit logs).
 * `job` names it in that log line, e.g. "the weekly summary".
 */
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
