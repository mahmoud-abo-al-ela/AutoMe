import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import {
  findAnswerSuggestions,
  findAnswersForCarByMeaning,
  findNearestEarlierQuestion,
  findQuestionsMissingEmbedding,
  foldQuestionInto,
  linkRelatedQuestion,
  setQuestionEmbedding,
} from "@/lib/repositories/buyer-question";
import { db } from "@/lib/prisma";

const ORG = "org_test_similarity";
const OTHER_ORG = "org_test_similarity_other";
const CAR_A = "5d1c2a3b-0000-4000-8000-00000000000a";
const CAR_B = "5d1c2a3b-0000-4000-8000-00000000000b";
const CAR_OTHER = "5d1c2a3b-0000-4000-8000-00000000000c";
const MODEL = "gemini-embedding-2";

/** A 768-long vector pointing mostly along axis `i`, a little along `j`. */
function v(i: number, j = i, lean = 0): number[] {
  const out = new Array(768).fill(0);
  out[i] = 1;
  out[j] += lean;
  return out;
}

const car = (id: string, organizationId: string) => ({
  id,
  organizationId,
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  price: 500000,
  mileage: 40000,
  fuelType: "Petrol",
  transmission: "Automatic",
  color: "White",
  bodyType: "Sedan",
  status: "AVAILABLE" as const,
  images: [],
  features: [],
});

let seq = 0;
async function question(input: {
  organizationId?: string;
  carId: string;
  status?: "OPEN" | "ANSWERED" | "DISMISSED";
  answer?: string;
  vector?: number[];
  model?: string;
  createdAt?: Date;
  askCount?: number;
  appliesToAllCars?: boolean;
}) {
  const organizationId = input.organizationId ?? ORG;
  const row = await db.buyerQuestion.create({
    data: {
      organizationId,
      carId: input.carId,
      question: `q${++seq}`,
      questionKey: `q${seq}`,
      locale: "en",
      status: input.status ?? "OPEN",
      answer: input.answer ?? null,
      askCount: input.askCount ?? 1,
      appliesToAllCars: input.appliesToAllCars ?? false,
      ...(input.createdAt && { createdAt: input.createdAt }),
    },
  });
  if (input.vector) await setQuestionEmbedding({ id: row.id, organizationId, vector: input.vector, model: input.model ?? MODEL });
  return row;
}

const earlier = (minutes: number) => new Date(Date.now() - minutes * 60_000);

describe.skipIf(!hasTestDb)("buyer question similarity (real Postgres + pgvector)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: [ORG, OTHER_ORG] } } });
    await db.organization.create({ data: { id: ORG, name: "Sim Motors", slug: "sim-test", isActive: true } });
    await db.organization.create({ data: { id: OTHER_ORG, name: "Other Motors", slug: "sim-other", isActive: true } });
    await db.car.createMany({ data: [car(CAR_A, ORG), car(CAR_B, ORG), car(CAR_OTHER, OTHER_ORG)] });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: [ORG, OTHER_ORG] } } });
    await db.$disconnect();
  });

  it("finds the closest earlier question on the same car, by the same model, never a dismissed one", async () => {
    const close = await question({ carId: CAR_A, vector: v(1, 2, 0.1), createdAt: earlier(30) });
    await question({ carId: CAR_A, vector: v(1), status: "DISMISSED", createdAt: earlier(20) });
    await question({ carId: CAR_A, vector: v(1), model: "gemini-embedding-001", createdAt: earlier(20) });
    await question({ carId: CAR_B, vector: v(1), createdAt: earlier(20) });
    const asked = await question({ carId: CAR_A, vector: v(1) });

    const nearest = await findNearestEarlierQuestion({
      organizationId: ORG,
      carId: CAR_A,
      excludeId: asked.id,
      before: asked.createdAt,
      vector: v(1),
      model: MODEL,
      statuses: ["OPEN", "ANSWERED"],
    });
    expect(nearest?.id).toBe(close.id);
    expect(nearest!.similarity).toBeGreaterThan(0.99);
  });

  it("searches only the statuses asked for", async () => {
    await db.buyerQuestion.deleteMany({ where: { organizationId: ORG } });
    const answered = await question({ carId: CAR_A, status: "ANSWERED", answer: "No accidents.", vector: v(4), createdAt: earlier(30) });
    await question({ carId: CAR_A, vector: v(4), createdAt: earlier(20) });
    const asked = await question({ carId: CAR_A, vector: v(4) });
    const search = { organizationId: ORG, carId: CAR_A, excludeId: asked.id, before: asked.createdAt, vector: v(4), model: MODEL };

    expect((await findNearestEarlierQuestion({ ...search, statuses: ["ANSWERED"] }))?.id).toBe(answered.id);
    expect((await findNearestEarlierQuestion({ ...search, statuses: ["OPEN"] }))?.id).not.toBe(answered.id);
  });

  it("links a question to the answered one it rephrases, each keeping its own status", async () => {
    const answered = await question({ carId: CAR_A, status: "ANSWERED", answer: "No accidents." });
    const asked = await question({ carId: CAR_A });
    await linkRelatedQuestion({ id: asked.id, relatedId: answered.id, organizationId: ORG });

    const row = await db.buyerQuestion.findUnique({ where: { id: asked.id }, include: { relatedQuestion: true } });
    expect(row).toMatchObject({ status: "OPEN", relatedQuestion: { id: answered.id, status: "ANSWERED", answer: "No accidents." } });
    // Not across dealerships.
    const theirs = await question({ organizationId: OTHER_ORG, carId: CAR_OTHER });
    await linkRelatedQuestion({ id: theirs.id, relatedId: answered.id, organizationId: ORG });
    expect((await db.buyerQuestion.findUnique({ where: { id: theirs.id } }))?.relatedQuestionId).toBeNull();
  });

  it("folds an open repeat into the question it repeats, and never folds away an answer", async () => {
    const original = await question({ carId: CAR_A, askCount: 3, createdAt: earlier(60) });
    const repeat = await question({ carId: CAR_A, askCount: 2 });
    expect(await foldQuestionInto({ fromId: repeat.id, intoId: original.id, organizationId: ORG })).toBe(true);
    expect((await db.buyerQuestion.findUnique({ where: { id: original.id } }))?.askCount).toBe(5);
    expect(await db.buyerQuestion.findUnique({ where: { id: repeat.id } })).toBeNull();

    const answered = await question({ carId: CAR_A, status: "ANSWERED", answer: "Yes" });
    expect(await foldQuestionInto({ fromId: answered.id, intoId: original.id, organizationId: ORG })).toBe(false);
    expect(await db.buyerQuestion.findUnique({ where: { id: answered.id } })).not.toBeNull();
  });

  it("never folds across dealerships", async () => {
    const theirs = await question({ organizationId: OTHER_ORG, carId: CAR_OTHER });
    const ours = await question({ carId: CAR_A });
    expect(await foldQuestionInto({ fromId: theirs.id, intoId: ours.id, organizationId: ORG })).toBe(false);
  });

  it("ranks a car's dealer answers by meaning, unembedded ones last", async () => {
    await db.buyerQuestion.deleteMany({ where: { organizationId: ORG, status: "ANSWERED" } });
    const far = await question({ carId: CAR_A, status: "ANSWERED", answer: "far", vector: v(5) });
    const near = await question({ carId: CAR_A, status: "ANSWERED", answer: "near", vector: v(7, 5, 0.2) });
    const policy = await question({ carId: CAR_B, status: "ANSWERED", answer: "policy", vector: v(7), appliesToAllCars: true });
    await question({ carId: CAR_A, status: "ANSWERED", answer: "unembedded", askCount: 50 });
    await question({ carId: CAR_B, status: "ANSWERED", answer: "other car, not policy", vector: v(7) });

    const rows = await findAnswersForCarByMeaning({ carId: CAR_A, organizationId: ORG, vector: v(7), model: MODEL, take: 10 });
    expect(rows.map((r) => r.answer)).toEqual(["policy", "near", "far", "unembedded"]);
    expect([far, near, policy].length).toBe(3);
  });

  it("suggests the closest answer given on another of the dealership's cars", async () => {
    await db.buyerQuestion.deleteMany({ where: { organizationId: ORG } });
    await question({ carId: CAR_B, status: "ANSWERED", answer: "We offer 5-year installments", vector: v(9, 10, 0.1) });
    await question({ carId: CAR_A, status: "ANSWERED", answer: "same car", vector: v(9) });
    await question({ organizationId: OTHER_ORG, carId: CAR_OTHER, status: "ANSWERED", answer: "another dealer", vector: v(9) });
    const open = await question({ carId: CAR_A, vector: v(9) });

    const [suggestion] = await findAnswerSuggestions(ORG, [open.id]);
    expect(suggestion).toMatchObject({ questionId: open.id, answer: "We offer 5-year installments" });
    expect(suggestion.similarity).toBeGreaterThan(0.99);
  });

  it("lists questions with no vector from the current model, for the backfill", async () => {
    const stale = await question({ carId: CAR_A, vector: v(3), model: "gemini-embedding-001" });
    const none = await question({ carId: CAR_A });
    const ids = (await findQuestionsMissingEmbedding(MODEL, 100)).map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining([stale.id, none.id]));
  });
});
