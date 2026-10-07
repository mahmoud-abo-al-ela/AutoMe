import { db } from "@/lib/prisma";

/**
 * What the Messages sales desk shows beside a conversation (canvas: Messages
 * round 1, 2 · Sales desk): the car it is about — only if it is this
 * dealership's — and this buyer's history with the dealership: when they saved
 * this car, how many of its other cars they saved, their test drives here.
 * One round of parallel queries. `buyerId` is the app's user id, which is also
 * the buyer's Stream id.
 */
export async function findDealContext(organizationId: string, buyerId: string, carId: string | null) {
  const [car, savedThis, savedOthers, drives, buyer] = await Promise.all([
    carId
      ? db.car.findFirst({
          where: { id: carId, organizationId },
          select: {
            id: true,
            make: true,
            model: true,
            bodyType: true,
            year: true,
            title: true,
            titleEn: true,
            titleAr: true,
            price: true,
            priceCurrency: true,
            images: true,
            status: true,
            _count: { select: { savedBy: true } },
          },
        })
      : null,
    carId
      ? db.savedCar.findFirst({ where: { userId: buyerId, carId }, select: { createdAt: true } })
      : null,
    db.savedCar.count({
      where: { userId: buyerId, car: { organizationId }, ...(carId ? { carId: { not: carId } } : {}) },
    }),
    db.testDrive.findMany({
      where: { userId: buyerId, organizationId },
      select: { id: true, date: true, startTime: true, status: true, car: { select: { make: true, model: true, year: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 3,
    }),
    db.user.findUnique({ where: { id: buyerId }, select: { name: true } }),
  ]);
  return { car, savedThis, savedOthers, drives, buyer };
}
