import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Before @/lib/prisma is imported (hoisted), so the client connects to the test database.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { updateCarIfPhotosUnchanged, updateCarImageAlts } from "@/lib/repositories/car";
import { db } from "@/lib/prisma";

// Pins the SQL behind updateCarIfPhotosUnchanged; the service side is unit-tested.

const ORG = "org_test_car_photo_cas";
const OTHER_ORG = "org_test_car_photo_cas_other";
const A = "https://cdn.test/storage/v1/object/public/car-images/cars/x/a.jpg";
const B = "https://cdn.test/storage/v1/object/public/car-images/cars/x/b.jpg";
const C = "https://cdn.test/storage/v1/object/public/car-images/cars/x/c.jpg";

async function newCar(images: string[]) {
  return db.car.create({
    data: {
      organizationId: ORG,
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 500_000,
      mileage: 1,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      status: "AVAILABLE",
      images,
      features: [],
    },
  });
}

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: [ORG, OTHER_ORG] } } });
}

describe.skipIf(!hasTestDb)("car photo-edit compare-and-set (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Photo CAS Motors", slug: "test-car-photo-cas", isActive: true },
        { id: OTHER_ORG, name: "Other Motors", slug: "test-car-photo-cas-other", isActive: true },
      ],
    });
  });
  afterAll(async () => {
    await cleanUp();
    await db.$disconnect();
  });

  it("writes while the photos are the ones read", async () => {
    const car = await newCar([A, B]);

    const write = await updateCarIfPhotosUnchanged(car.id, ORG, [A, B], { images: [B, C], mileage: 2 });

    expect(write).toMatchObject({ status: "updated", car: { images: [B, C], mileage: 2 } });
  });

  it("writes nothing when another edit changed the photos first", async () => {
    const car = await newCar([A, B]);
    const seen = car.images;

    expect((await updateCarIfPhotosUnchanged(car.id, ORG, seen, { images: [A, C] })).status).toBe("updated");

    const write = await updateCarIfPhotosUnchanged(car.id, ORG, seen, { images: [B], mileage: 99 });

    expect(write).toEqual({ status: "photosChanged" });
    expect(await db.car.findUniqueOrThrow({ where: { id: car.id } })).toMatchObject({ images: [A, C], mileage: 1 });
  });

  it("treats a reorder as a change: the order is what the gallery shows", async () => {
    const car = await newCar([A, B]);
    expect((await updateCarIfPhotosUnchanged(car.id, ORG, [B, A], { mileage: 5 })).status).toBe("photosChanged");
  });

  it("is not thrown off by the alt-text job writing the car in between", async () => {
    const car = await newCar([A]);
    await updateCarImageAlts(car.id, ORG, { [A]: { en: "Front view", ar: "منظر أمامي" } });

    expect((await updateCarIfPhotosUnchanged(car.id, ORG, [A], { mileage: 7 })).status).toBe("updated");
  });

  it("is notFound for another dealership's car, and writes nothing", async () => {
    const car = await newCar([A]);

    expect(await updateCarIfPhotosUnchanged(car.id, OTHER_ORG, [A], { mileage: 8 })).toEqual({ status: "notFound" });
    expect(await db.car.findUniqueOrThrow({ where: { id: car.id } })).toMatchObject({ mileage: 1 });
  });

  it("matches a car with no photos yet", async () => {
    const car = await newCar([]);
    expect((await updateCarIfPhotosUnchanged(car.id, ORG, [], { images: [A] })).status).toBe("updated");
  });
});
