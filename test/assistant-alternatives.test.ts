import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { findOtherAvailableCarsMatching } from "@/lib/repositories/car/assistant-alternatives";
import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

const OWN = "org_test_alternatives_own";
const OTHER = "org_test_alternatives_other";
const keyOf = new Map<string, string>();
let viewed = "";

async function car(organizationId: string, key: string, data: Partial<Prisma.CarUncheckedCreateInput> = {}) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 500_000,
      mileage: 10_000,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      status: "AVAILABLE",
      images: [],
      features: [],
      ...data,
    },
  });
  keyOf.set(row.id, key);
  return row.id;
}

const alternatives = async (question: string, take = 8) =>
  (await findOtherAvailableCarsMatching({ organizationId: OWN, excludeCarId: viewed, question, price: 500_000, take })).map(
    (row) => keyOf.get(row.id)
  );

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: [OWN, OTHER] } } });
}

describe.skipIf(!hasTestDb)("listing assistant alternatives (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: OWN, name: "Alternatives Own", slug: "test-alternatives-own", isActive: true },
        { id: OTHER, name: "Alternatives Other", slug: "test-alternatives-other", isActive: true },
      ],
    });
    viewed = await car(OWN, "viewed");
    // Ten cars closer in price than any Kia: the old "closest 8" never reached one.
    for (let i = 0; i < 10; i++) {
      await car(OWN, `near${i}`, { model: "Corolla", price: 490_000 + i * 2_000, color: i === 0 ? "Black" : "White" });
    }
    await car(OWN, "sportage", { make: "Kia", model: "Sportage", price: 1_900_000, bodyType: "SUV" });
    await car(OWN, "k5", { make: "Kia", model: "K5", price: 700_000 });
    await car(OWN, "soldKia", { make: "Kia", model: "Cerato", price: 520_000, status: "SOLD" });
    await car(OTHER, "otherKia", { make: "Kia", model: "Picanto", price: 500_000 });
  });

  afterAll(cleanUp);

  it("finds the cars a question names, nearest the viewed price first, however far that is", async () => {
    expect(await alternatives("Do you have a Kia?")).toEqual(["k5", "sportage"]);
  });

  it("reads the question as the site's search does: Arabic, words that name nothing ignored", async () => {
    expect(await alternatives("عندكم كيا لو سمحت؟")).toEqual(["k5", "sportage"]);
    expect(await alternatives("عندكم SUV؟")).toEqual(["sportage"]);
  });

  it("never offers another dealership's car, a sold one, or the car being viewed", async () => {
    const kias = await alternatives("kia");
    expect(kias).not.toContain("otherKia");
    expect(kias).not.toContain("soldKia");
    expect(await alternatives("corolla", 20)).not.toContain("viewed");
  });

  it("matches a colour too, and keeps to the number asked for", async () => {
    expect(await alternatives("in black?")).toEqual(["near0"]);
    // An Arabic question mark is punctuation, not part of the word.
    expect(await alternatives("عندكم أسود؟")).toEqual(["near0"]);
    expect(await alternatives("عندكم كيا؟")).toEqual(["k5", "sportage"]);
    expect(await alternatives("corolla", 3)).toHaveLength(3);
  });

  it("finds nothing when the question names none of the cars, so the caller offers the closest in price", async () => {
    expect(await alternatives("Is the price negotiable?")).toEqual([]);
    expect(await alternatives("BMW?")).toEqual([]);
  });
});
