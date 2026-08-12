import { NextResponse } from "next/server";
import { cleanupExpiredAuditLogs } from "@/lib/services/audit";
import { logError } from "@/lib/utils/errors";

/**
 * Cron job to clean up expired audit logs
 * Should be called daily via Vercel Cron or similar
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-audit-logs",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Fail closed: a missing secret must reject, never skip the check. With the
    // old `if (cronSecret && …)` guard, an unset CRON_SECRET let anyone trigger
    // audit-log deletion. The Stripe webhook already fails closed — match it.
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logError("CRON_SECRET is not configured; refusing audit-log cleanup");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedCount = await cleanupExpiredAuditLogs();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired audit logs`,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Audit log cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup audit logs" },
      { status: 500 }
    );
  }
}
