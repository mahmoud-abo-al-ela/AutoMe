import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { cleanupExpiredAuditLogs } from "@/lib/services/audit";
import { logError } from "@/lib/utils/errors";

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
