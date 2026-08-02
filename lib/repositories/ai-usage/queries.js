// AI usage repository - Data access layer for AI usage queries
import { db } from "@/lib/prisma";

/**
 * Start of the current calendar month in UTC. Plan quotas reset monthly, so the
 * per-org count is bounded from here.
 */
function startOfCurrentMonthUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Count an organization's *successful* AI calls in the current calendar month,
 * restricted to the given billable features. Drives RESOURCE_CONFIG.aiProcessing
 * in plan-limits (replaces the old CAR_CREATED audit-row proxy).
 *
 * `organizationId` is required and must be server-sourced from ctx /
 * getCurrentOrganization() — never a client argument (see tenant-isolation skill).
 * Failed calls are excluded so a provider error never burns a customer's quota.
 */
export async function countOrgAiCallsThisMonth(organizationId, features) {
    return db.aiUsage.count({
        where: {
            organizationId,
            success: true,
            feature: { in: features },
            createdAt: { gte: startOfCurrentMonthUtc() },
        },
    });
}

/**
 * Count platform-wide AI calls since a timestamp, across every feature and tenant.
 * Backs the free-tier request-count circuit breaker (RPD / RPM): the provider cap
 * is per project key regardless of feature, so this counts every recorded attempt
 * (success or failure) since each represents a request sent to the provider.
 */
export async function countPlatformCallsSince(since) {
    return db.aiUsage.count({
        where: {
            createdAt: { gte: since },
        },
    });
}
