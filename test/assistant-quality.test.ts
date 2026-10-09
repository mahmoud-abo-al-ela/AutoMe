import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import {
  countAssistantRatings,
  countAssistantReplies,
  findAssistantQualityByModel,
  findUnhelpfulAnswers,
} from "@/lib/repositories/super-admin/analytics";
import { db } from "@/lib/prisma";

/**
 * The super-admin quality report reads groupBy over nullable columns — a row
 * from before provenance was kept has no model — which only real Postgres can
 * show grouping correctly.
 */
const ORG_ID = "org_test_assistant_quality";
const CAR_ID = "6b0f9d3e-7d0a-4c6e-9e44-2a1f6f3c9a01";

const window = () => ({ from: new Date(Date.now() - 60 * 60_000), to: new Date(Date.now() + 60_000) });

describe.skipIf(!hasTestDb)("listing assistant quality (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.organization.create({ data: { id: ORG_ID, name: "Quality Motors", slug: "quality-test", isActive: true } });
    await db.car.create({
      data: {
        id: CAR_ID,
        organizationId: ORG_ID,
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        price: 500000,
        mileage: 40000,
        fuelType: "Petrol",
        transmission: "Automatic",
        color: "White",
        bodyType: "Sedan",
        status: "AVAILABLE",
        images: [],
        features: [],
      },
    });

    const row = (over: Record<string, unknown>) => ({
      organizationId: ORG_ID,
      carId: CAR_ID,
      question: "What colour?",
      answer: "White.",
      locale: "en",
      outcome: "ANSWERED" as const,
      model: "google/gemini-3.5-flash-lite",
      promptVersion: "v2.en",
      ...over,
    });
    await db.assistantAnswer.createMany({
      data: [
        row({ helpful: true, ratedAt: new Date() }),
        row({ helpful: true, ratedAt: new Date() }),
        row({ helpful: false, ratedAt: new Date(), question: "Any accidents?", answer: "None." }),
        row({}),
        // A fallback model, and an answer from before provenance was kept.
        row({ model: "codecraft/gpt-5.5", helpful: false, ratedAt: new Date(Date.now() - 60_000) }),
        row({ model: null, promptVersion: null }),
        // Declines and off-topic replies count as replies, never as answers.
        row({ outcome: "DECLINED", answer: "" }),
        row({ outcome: "OFF_TOPIC", answer: "" }),
        // Outside the window.
        row({ createdAt: new Date("2020-01-01T00:00:00Z"), helpful: false }),
      ],
    });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG_ID } });
    await db.$disconnect();
  });

  it("counts every reply by what the assistant did", async () => {
    expect(await countAssistantReplies(window())).toEqual({ answered: 6, declined: 1, offTopic: 1 });
  });

  it("counts the ratings of answers only", async () => {
    expect(await countAssistantRatings(window())).toEqual({ helpful: 2, unhelpful: 2 });
  });

  it("groups answers by model and prompt, rated and helpful counted per group", async () => {
    const rows = await findAssistantQualityByModel(window());
    expect(rows).toEqual([
      { model: "google/gemini-3.5-flash-lite", promptVersion: "v2.en", answers: 4, rated: 3, helpful: 2 },
      expect.objectContaining({ answers: 1 }),
      expect.objectContaining({ answers: 1 }),
    ]);
    expect(rows).toContainEqual({ model: null, promptVersion: null, answers: 1, rated: 0, helpful: 0 });
    expect(rows).toContainEqual({ model: "codecraft/gpt-5.5", promptVersion: "v2.en", answers: 1, rated: 1, helpful: 0 });
  });

  it("lists the latest unhelpful answers, newest rating first, with the dealership", async () => {
    const rows = await findUnhelpfulAnswers(window(), 5);
    expect(rows.map((r) => r.question)).toEqual(["Any accidents?", "What colour?"]);
    expect(rows[0]).toMatchObject({ carId: CAR_ID, model: "google/gemini-3.5-flash-lite", organization: { name: "Quality Motors" } });
  });
});
