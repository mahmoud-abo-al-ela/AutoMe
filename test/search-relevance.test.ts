import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { searchCarsRanked } from "@/lib/repositories/car/search";
import { db } from "@/lib/prisma";
import {
  CARS,
  HIDDEN_TENANT_CARS,
  OTHER_TENANT_CARS,
  QUERIES,
  type RelevanceCar,
  type RelevanceQuery,
} from "@/test/fixtures/search-relevance";

/**
 * How well the words alone rank one dealership's inventory, measured.
 *
 *   TEST_DATABASE_URL=… pnpm vitest run test/search-relevance
 *
 * Every query in test/fixtures/search-relevance.ts is run against real
 * Postgres and scored:
 *
 * - P@k — of the first k results, the share the buyer was looking for, with
 *   k = min(5, how many such cars exist), so a perfect search scores 1.
 * - recall@10 — the share of what the buyer was looking for that made the top
 *   10 (of at most 10): a search that hides most of the right cars scores low.
 * - MRR — 1 / the rank of the first such car (0 when none is in the top 10).
 * - irrelevant rate — the share of the top 10 that is neither what was asked
 *   nor a fair thing to show.
 * - target rank — for a navigational query ("bmw x5"), where its one car lands.
 *
 * The averages, overall and per language, must not fall below the committed
 * baseline (search-relevance.baseline.json), and no target may drop: the
 * database is deterministic, so the comparison is exact. A change that moves
 * them up re-records the baseline in the same commit:
 *
 *   SEARCH_EVAL_UPDATE_BASELINE=1 pnpm vitest run test/search-relevance
 *
 * SEARCH_EVAL_REPORT=<file> also writes every query's results and scores.
 *
 * Words only: meaning (pgvector) needs a model to embed the query, which CI
 * must not call. Fusion is covered by test/hybrid-search.test.ts, and meaning
 * by the manual AI evaluation.
 */

const REL_ORG = "org_test_relevance";
const OTHER_ORG = "org_test_relevance_other";
const HIDDEN_ORG = "org_test_relevance_hidden";
const BASELINE = path.join(process.cwd(), "test", "search-relevance.baseline.json");
const TOP = 10;
const EPSILON = 1e-9;

type Scores = { pAtK: number; recall: number; mrr: number; irrelevantRate: number };
type QueryResult = Scores & { lang: string; results: string[]; total: number; targetRank: number | null };
type Report = {
  queries: Record<string, QueryResult>;
  aggregate: Record<"overall" | "en" | "ar", Scores & { zeroResults: number }>;
};

const keyOf = new Map<string, string>();

let created = 0;
async function insert(organizationId: string, key: string, car: RelevanceCar) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price ?? 500_000,
      mileage: 40_000,
      fuelType: car.fuelType ?? "Gasoline",
      transmission: car.transmission,
      color: car.color ?? "White",
      bodyType: car.bodyType,
      status: car.status ?? "AVAILABLE",
      images: [],
      features: car.features ?? [],
      featuresAr: car.featuresAr ?? [],
      descriptionEn: car.descriptionEn ?? null,
      descriptionAr: car.descriptionAr ?? null,
      // A fixed, distinct creation time: equal ranks order the same way every run.
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, created++)),
    },
  });
  keyOf.set(row.id, key);
}

function score(q: RelevanceQuery, results: string[]): Scores & { targetRank: number | null } {
  const relevant = new Set<string>(q.relevant);
  const recall = results.filter((key) => relevant.has(key)).length / Math.min(TOP, q.relevant.length);
  const fair = new Set<string>([...q.relevant, ...(q.acceptable ?? [])]);
  const k = Math.min(5, q.relevant.length);
  const pAtK = results.slice(0, k).filter((key) => relevant.has(key)).length / k;
  const first = results.findIndex((key) => relevant.has(key));
  const mrr = first === -1 ? 0 : 1 / (first + 1);
  const irrelevantRate = results.length === 0 ? 0 : results.filter((key) => !fair.has(key)).length / results.length;
  const targetRank = q.target ? results.indexOf(q.target) + 1 || null : null;
  return { pAtK, recall, mrr, irrelevantRate, targetRank };
}

function average(rows: QueryResult[]) {
  const mean = (pick: (row: QueryResult) => number) =>
    rows.length === 0 ? 0 : rows.reduce((sum, row) => sum + pick(row), 0) / rows.length;
  return {
    pAtK: mean((r) => r.pAtK),
    recall: mean((r) => r.recall),
    mrr: mean((r) => r.mrr),
    irrelevantRate: mean((r) => r.irrelevantRate),
    zeroResults: rows.filter((r) => r.total === 0).length,
  };
}

async function clean() {
  await db.organization.deleteMany({ where: { id: { in: [REL_ORG, OTHER_ORG, HIDDEN_ORG] } } });
}

describe.skipIf(!hasTestDb)("search relevance, words alone (real Postgres)", () => {
  const report: Report = { queries: {}, aggregate: {} as Report["aggregate"] };

  beforeAll(async () => {
    await clean();
    await db.organization.createMany({
      data: [
        { id: REL_ORG, name: "Relevance Motors", slug: "relevance-test", isActive: true },
        { id: OTHER_ORG, name: "Other Motors", slug: "relevance-test-other", isActive: true },
        { id: HIDDEN_ORG, name: "Hidden Motors", slug: "relevance-test-hidden", isActive: false },
      ],
    });
    for (const [key, car] of Object.entries(CARS)) await insert(REL_ORG, key, car);
    for (const [key, car] of Object.entries(OTHER_TENANT_CARS)) await insert(OTHER_ORG, key, car);
    for (const [key, car] of Object.entries(HIDDEN_TENANT_CARS)) await insert(HIDDEN_ORG, key, car);

    for (const q of QUERIES) {
      const { cars, pagination } = await searchCarsRanked(
        { search: q.query, organizationId: REL_ORG },
        { page: 1, limit: TOP }
      );
      const results = cars.map((car) => keyOf.get((car as { id: string }).id) ?? `unknown:${(car as { id: string }).id}`);
      report.queries[q.query] = { lang: q.lang, results, total: pagination.total, ...score(q, results) };
    }

    const rows = Object.values(report.queries);
    report.aggregate = {
      overall: average(rows),
      en: average(rows.filter((r) => r.lang === "en")),
      ar: average(rows.filter((r) => r.lang === "ar")),
    };

    const table = Object.entries(report.queries).map(([query, r]) => ({
      query,
      total: r.total,
      "P@k": r.pAtK.toFixed(2),
      "R@10": r.recall.toFixed(2),
      RR: r.mrr.toFixed(2),
      irrelevant: r.irrelevantRate.toFixed(2),
      target: r.targetRank ?? "",
    }));
    console.table(table);
    console.log("[relevance]", JSON.stringify(report.aggregate));

    if (process.env.SEARCH_EVAL_REPORT) {
      writeFileSync(process.env.SEARCH_EVAL_REPORT, JSON.stringify(report, null, 2));
    }
    if (process.env.SEARCH_EVAL_UPDATE_BASELINE) {
      writeFileSync(BASELINE, `${JSON.stringify(report, null, 2)}\n`);
    }
  }, 60_000);

  afterAll(async () => {
    await clean();
    await db.$disconnect();
  });

  it("never returns another dealership's car, or a sold one", () => {
    for (const r of Object.values(report.queries)) {
      for (const key of r.results) {
        expect(key in CARS, `${key} is not this dealership's`).toBe(true);
        expect(key).not.toBe("corollaSold");
      }
    }
  });

  it("does not rank worse than the recorded baseline", () => {
    expect(existsSync(BASELINE), "no baseline — record one with SEARCH_EVAL_UPDATE_BASELINE=1").toBe(true);
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Report;

    for (const group of ["overall", "en", "ar"] as const) {
      const now = report.aggregate[group];
      const was = baseline.aggregate[group];
      expect(now.pAtK, `${group} P@k`).toBeGreaterThanOrEqual(was.pAtK - EPSILON);
      expect(now.recall, `${group} recall@10`).toBeGreaterThanOrEqual(was.recall - EPSILON);
      expect(now.mrr, `${group} MRR`).toBeGreaterThanOrEqual(was.mrr - EPSILON);
      expect(now.irrelevantRate, `${group} irrelevant rate`).toBeLessThanOrEqual(was.irrelevantRate + EPSILON);
    }

    for (const q of QUERIES.filter((q) => q.target)) {
      const was = baseline.queries[q.query]?.targetRank ?? null;
      if (was === null) continue;
      const now = report.queries[q.query].targetRank;
      expect(now, `"${q.query}" target dropped out of the top ${TOP}`).not.toBeNull();
      expect(now!, `"${q.query}" target rank`).toBeLessThanOrEqual(was);
    }
  });
});
