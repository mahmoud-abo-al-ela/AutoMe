import { db } from "@/lib/prisma";

export async function getInsightRows(
  organizationId: string,
  { since, before }: { since: Date; before: Date },
) {
  const inPeriod = { gte: since };
  const inPrevious = { gte: before, lt: since };

  const [
    drives,
    drivesBefore,
    completedBefore,
    saves,
    savesBefore,
    questions,
    questionsBefore,
    stock,
    cars,
  ] = await Promise.all([
    db.testDrive.findMany({
      where: { organizationId, createdAt: inPeriod },
      select: { createdAt: true, status: true, userId: true, carId: true },
    }),
    db.testDrive.count({ where: { organizationId, createdAt: inPrevious } }),
    db.testDrive.count({ where: { organizationId, createdAt: inPrevious, status: "COMPLETED" } }),
    db.savedCar.findMany({
      where: { car: { organizationId }, createdAt: inPeriod },
      select: { userId: true, carId: true },
    }),
    db.savedCar.count({ where: { car: { organizationId }, createdAt: inPrevious } }),
    db.buyerQuestion.findMany({
      where: { organizationId, lastAskedAt: inPeriod },
      select: { carId: true },
    }),
    db.buyerQuestion.count({ where: { organizationId, lastAskedAt: inPrevious } }),
    db.car.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } }),
    db.car.findMany({
      where: { organizationId, status: { not: "SOLD" } },
      select: {
        id: true,
        make: true,
        model: true,
        bodyType: true,
        year: true,
        price: true,
        priceCurrency: true,
        createdAt: true,
        status: true,
      },
      take: 500,
    }),
  ]);

  return {
    drives,
    drivesBefore,
    completedBefore,
    saves,
    savesBefore,
    questions,
    questionsBefore,
    stock,
    cars: cars.map(({ price, ...car }) => ({ ...car, price: Number(price) })),
  };
}
