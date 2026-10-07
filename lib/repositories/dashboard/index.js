// Dashboard repository - Data access layer
import { db } from "@/lib/prisma";

// The overview's figures and lists are read by ./today.ts and the Insights
// page by ./insights.ts; this keeps the per-day test-drive series.

/**
 * Get test drive trends over time
 */
export async function getTestDriveTrends(organizationId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const testDrives = await db.testDrive.findMany({
    where: {
      organizationId,
      createdAt: { gte: cutoffDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  const dateMap = new Map();

  // Initialize last `days` days with 0 counts
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dateMap.set(dateStr, {
      date: dateStr,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    });
  }

  // Populate data
  testDrives.forEach((td) => {
    const dateStr = td.createdAt.toISOString().split("T")[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr);
      if (td.status === "PENDING") entry.pending += 1;
      if (td.status === "CONFIRMED") entry.confirmed += 1;
      if (td.status === "COMPLETED") entry.completed += 1;
      if (td.status === "CANCELLED") entry.cancelled += 1;
    }
  });

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}
