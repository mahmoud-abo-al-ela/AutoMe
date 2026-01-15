import { NextResponse } from "next/server";
import { cleanupExpiredAuditLogs } from "@/lib/services/audit";

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
export async function GET(request) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    console.error("Audit log cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup audit logs" },
      { status: 500 }
    );
  }
}
