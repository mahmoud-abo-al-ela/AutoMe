import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { cleanupExpiredAuditLogs } from "@/lib/services/audit";
import { logError } from "@/lib/utils/errors";

/**
 * Enforce each plan's activity retention: delete audit entries whose
 * retainUntil has passed (set from the dealership's plan when written).
 * Entries with no retainUntil — super-admin actions, Enterprise — are kept.
 *
 * Scheduled in vercel.json at 01:30 UTC (owner's decision, 2026-10-14).
 * Deletion is permanent; running again only finds what has expired since.
 */
export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "audit-log cleanup");
  if (refused) return refused;

  try {
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
