import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { createAiTrace, findTracesByUsage, pruneAiTraces } from "@/lib/repositories/ai-trace";
import { db } from "@/lib/prisma";

const trace = (aiUsageId: string) => ({
  aiUsageId,
  feature: "listingQA",
  model: "google/gemini-3.5-flash-lite",
  promptVersion: "v1",
  input: "{}",
  output: "{}",
  errorCode: null,
});

describe.skipIf(!hasTestDb)("AI traces (real Postgres)", () => {
  beforeAll(async () => {
    await db.aiTrace.deleteMany({});
    await createAiTrace(trace("fresh"));
    await db.aiTrace.create({ data: { ...trace("stale"), createdAt: new Date(Date.now() - 15 * 86_400_000) } });
  });

  afterAll(async () => {
    await db.aiTrace.deleteMany({});
    await db.$disconnect();
  });

  it("finds traces by their ledger rows", async () => {
    const found = await findTracesByUsage(["fresh", "missing"]);
    expect(found.map((t) => t.aiUsageId)).toEqual(["fresh"]);
  });

  it("prunes past the 14-day retention, and only that", async () => {
    expect(await pruneAiTraces()).toBe(1);
    expect((await db.aiTrace.findMany()).map((t) => t.aiUsageId)).toEqual(["fresh"]);
  });
});
