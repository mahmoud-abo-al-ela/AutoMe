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
export async function countOrgAiCallsThisMonth(organizationId: string, features: string[]) {
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
export async function countPlatformCallsSince(since: Date) {
    return db.aiUsage.count({
        where: {
            createdAt: { gte: since },
        },
    });
}

/**
 * Reporting reads for the AI usage surface.
 *
 * `AiUsage` has carried a `[feature, createdAt]` index commented "per-feature
 * reporting" since it was created, and nothing has ever queried it — the table
 * was write-only in practice, read solely by the quota gate. These are the
 * readers it was indexed for.
 *
 * All of them are platform-wide and therefore super-admin only. A per-tenant
 * view has to filter on `organizationId`, which the composite index leads with.
 */

/** One row per feature: how much it is used and how often it fails. */
export interface FeatureUsage {
    feature: string;
    calls: number;
    failures: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    costMicroUsd: number;
}

export async function getUsageByFeature(since: Date): Promise<FeatureUsage[]> {
    const grouped = await db.aiUsage.groupBy({
        by: ["feature"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: {
            inputTokens: true,
            outputTokens: true,
            thinkingTokens: true,
            costMicroUsd: true,
        },
    });

    const failures = await db.aiUsage.groupBy({
        by: ["feature"],
        where: { createdAt: { gte: since }, success: false },
        _count: { _all: true },
    });

    const failureByFeature = new Map(
        failures.map((f) => [f.feature, f._count._all])
    );

    return grouped
        .map((row) => ({
            feature: row.feature,
            calls: row._count._all,
            failures: failureByFeature.get(row.feature) ?? 0,
            inputTokens: row._sum.inputTokens ?? 0,
            outputTokens: row._sum.outputTokens ?? 0,
            thinkingTokens: row._sum.thinkingTokens ?? 0,
            costMicroUsd: row._sum.costMicroUsd ?? 0,
        }))
        .sort((a, b) => b.calls - a.calls);
}

/** One row per model, with the latency percentiles a mean would hide. */
export interface ModelUsage {
    model: string;
    calls: number;
    failures: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
}

export async function getUsageByModel(since: Date): Promise<ModelUsage[]> {
    // Raw because Prisma cannot express percentile_cont, and a mean latency is
    // actively misleading here: a chain that mostly answers in 8s and sometimes
    // takes 50 averages to something that never happens.
    const rows = await db.$queryRaw<
        {
            model: string;
            calls: bigint;
            failures: bigint;
            p50: number | null;
            p95: number | null;
        }[]
    >`
        SELECT
            "model",
            COUNT(*)                                                         AS calls,
            COUNT(*) FILTER (WHERE NOT "success")                            AS failures,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY "latencyMs")         AS p50,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY "latencyMs")        AS p95
        FROM "AiUsage"
        WHERE "createdAt" >= ${since}
        GROUP BY "model"
        ORDER BY calls DESC
    `;

    return rows.map((row) => ({
        model: row.model,
        calls: Number(row.calls),
        failures: Number(row.failures),
        p50LatencyMs: Math.round(row.p50 ?? 0),
        p95LatencyMs: Math.round(row.p95 ?? 0),
    }));
}

/**
 * Failure counts by error code.
 *
 * The codes are deliberately coarse and stable (`HTTP_503`, `TIMEOUT`,
 * `SCHEMA_REJECTED`) so that grouping by them means something. This is the view
 * that distinguishes "the provider is saturated" from "our schema stopped
 * matching what the model returns", which look identical from a failure rate.
 */
export async function getFailuresByCode(
    since: Date
): Promise<{ errorCode: string; count: number }[]> {
    const grouped = await db.aiUsage.groupBy({
        by: ["errorCode"],
        where: { createdAt: { gte: since }, success: false },
        _count: { _all: true },
    });

    return grouped
        .map((row) => ({
            errorCode: row.errorCode ?? "UNKNOWN",
            count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count);
}
