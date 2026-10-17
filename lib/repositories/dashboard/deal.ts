import { db } from "@/lib/prisma";

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
    // Scoped like the car itself: unscoped, another dealership's car id told
    // this one whether — and when — the buyer saved it.
    carId
      ? db.savedCar.findFirst({ where: { userId: buyerId, carId, car: { organizationId } }, select: { createdAt: true } })
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
