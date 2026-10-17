// AI usage repository - Data access layer for AI usage queries
import { db } from "@/lib/prisma";
import { cairoDate, cairoMidnight } from "@/lib/utils/date-only";

export function startOfCurrentMonthCairo(now: Date = new Date()): Date {
    return cairoMidnight(`${cairoDate(now).slice(0, 7)}-01`);
}

export async function countOrgAiCarsThisMonth(organizationId: string, features: string[]) {
    const cars = await db.aiUsage.findMany({
        where: {
            organizationId,
            success: true,
            feature: { in: features },
            carId: { not: null },
            createdAt: { gte: startOfCurrentMonthCairo() },
        },
        distinct: ["carId"],
        select: { carId: true },
    });
    return cars.length;
}

export async function countOrgUnsavedAiCallsThisMonth(organizationId: string, feature: string) {
    return db.aiUsage.count({
        where: {
            organizationId,
            success: true,
            feature,
            carId: null,
            createdAt: { gte: startOfCurrentMonthCairo() },
        },
    });
}


export async function findProviderLedgersSince(since: Date): Promise<string[]> {
    const rows = await db.aiUsage.findMany({
        where: { createdAt: { gte: since } },
        distinct: ["provider"],
        select: { provider: true },
    });
    return rows.map((row) => row.provider);
}

export async function countPlatformCallsSince(since: Date, provider: string) {
    return db.aiUsage.count({
        where: {
            provider,
            createdAt: { gte: since },
        },
    });
}

export async function sumProviderTokensSince(provider: string, since: Date) {
    const totals = await db.aiUsage.aggregate({
        where: { provider, createdAt: { gte: since } },
        _sum: { inputTokens: true, outputTokens: true, thinkingTokens: true },
    });
    return (
        (totals._sum.inputTokens ?? 0) +
        (totals._sum.outputTokens ?? 0) +
        (totals._sum.thinkingTokens ?? 0)
    );
}

/** One row per feature: how much it is used and how often it fails. */
export interface FeatureUsage {
    feature: string;
    calls: number;
    failures: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    /** Input tokens the provider served from its prompt cache — a subset of inputTokens. */
    cachedTokens: number;
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
            cachedTokens: true,
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
            cachedTokens: row._sum.cachedTokens ?? 0,
            costMicroUsd: row._sum.costMicroUsd ?? 0,
        }))
        .sort((a, b) => b.calls - a.calls);
}

/** One row per model, with the latency percentiles a mean would hide. */
export interface ModelUsage {
    /** "ledger/model" — the ledger is the provider id, or "id#n" for its n-th key. */
    model: string;
    calls: number;
    failures: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    cachedTokens: number;
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
            input: bigint | null;
            output: bigint | null;
            thinking: bigint | null;
            cached: bigint | null;
        }[]
    >`
        SELECT
            "provider" || '/' || "model"                                      AS model,
            COUNT(*)                                                         AS calls,
            COUNT(*) FILTER (WHERE NOT "success")                            AS failures,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY "latencyMs")         AS p50,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY "latencyMs")        AS p95,
            SUM("inputTokens")                                               AS input,
            SUM("outputTokens")                                              AS output,
            SUM("thinkingTokens")                                            AS thinking,
            SUM("cachedTokens")                                              AS cached
        FROM "AiUsage"
        WHERE "createdAt" >= ${since}
        GROUP BY "provider", "model"
        ORDER BY calls DESC
    `;

    return rows.map((row) => ({
        model: row.model,
        calls: Number(row.calls),
        failures: Number(row.failures),
        p50LatencyMs: Math.round(row.p50 ?? 0),
        p95LatencyMs: Math.round(row.p95 ?? 0),
        inputTokens: Number(row.input ?? 0),
        outputTokens: Number(row.output ?? 0),
        thinkingTokens: Number(row.thinking ?? 0),
        cachedTokens: Number(row.cached ?? 0),
    }));
}

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

/** One failed attempt, as an operator reads it: what, where, when — no tenant or user. */
export interface RecentFailure {
    id: string;
    createdAt: Date;
    feature: string;
    provider: string;
    model: string;
    errorCode: string | null;
    latencyMs: number;
}

/** The latest failed attempts, newest first, across every feature and tenant. */
export async function findRecentFailures(since: Date, limit: number): Promise<RecentFailure[]> {
    return db.aiUsage.findMany({
        where: { createdAt: { gte: since }, success: false },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, createdAt: true, feature: true, provider: true, model: true, errorCode: true, latencyMs: true },
    });
}

export async function findOrganizationsOverCallCount(
    since: Date,
    limit: number
): Promise<{ organizationId: string; calls: number }[]> {
    const rows = await db.aiUsage.groupBy({
        by: ["organizationId"],
        where: { createdAt: { gte: since }, organizationId: { not: null } },
        _count: { _all: true },
        having: { organizationId: { _count: { gt: limit } } },
        orderBy: { _count: { organizationId: "desc" } },
    });
    return rows.map((row) => ({ organizationId: row.organizationId!, calls: row._count._all }));
}
