import * as aiUsageRepo from "@/lib/repositories/ai-usage";
import { reportSignal } from "@/lib/observability/report";

/** Calls in a day above which a dealership's AI use is worth a look, unless AI_DAILY_CALLS_ALERT says otherwise. */
export const DEFAULT_DAILY_CALLS_ALERT = 500;

export function dailyCallsAlert(): number {
  const configured = Number(process.env.AI_DAILY_CALLS_ALERT);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_DAILY_CALLS_ALERT;
}

export async function watchAiUsage(now: Date = new Date()) {
  const limit = dailyCallsAlert();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const organizations = await aiUsageRepo.findOrganizationsOverCallCount(since, limit);

  await Promise.all(
    organizations.map(({ organizationId, calls }) =>
      reportSignal({
        name: "ai.usage-spike",
        level: "warning",
        tags: { "organization.id": organizationId },
        groupBy: organizationId,
        context: { calls, limit, since: since.toISOString() },
      })
    )
  );

  return { since, limit, organizations };
}
