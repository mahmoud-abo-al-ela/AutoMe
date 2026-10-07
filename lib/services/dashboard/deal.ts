import * as dealRepository from "@/lib/repositories/dashboard/deal";
import { marketPositionsFor } from "@/lib/services/car/market-price";
import { verifyAccess } from "./access";

/**
 * The deal beside a conversation: the car with where its price sits among
 * similar cars, and what this buyer has done with the dealership so far.
 * A car that is not the dealership's is left out rather than shown.
 */
export async function getDealContext(
  userId: string,
  organizationId: string,
  { buyerId, carId }: { buyerId: string; carId?: string | null },
) {
  await verifyAccess(userId, organizationId);
  const rows = await dealRepository.findDealContext(organizationId, buyerId, carId ?? null);

  const car = rows.car
    ? {
        id: rows.car.id,
        make: rows.car.make,
        model: rows.car.model,
        year: rows.car.year,
        title: rows.car.title,
        titleEn: rows.car.titleEn,
        titleAr: rows.car.titleAr,
        price: Number(rows.car.price),
        priceCurrency: rows.car.priceCurrency,
        image: rows.car.images[0] ?? null,
        status: rows.car.status,
        saves: rows.car._count.savedBy,
      }
    : null;

  const market = rows.car
    ? ((await marketPositionsFor([{ ...rows.car, price: Number(rows.car.price) }])).get(rows.car.id) ?? null)
    : null;

  return {
    car,
    market,
    buyer: {
      name: rows.buyer?.name ?? null,
      savedThisAt: rows.savedThis?.createdAt ?? null,
      savedOthers: rows.savedOthers,
      drives: rows.drives.map((drive) => ({
        id: drive.id,
        date: drive.date.toISOString().slice(0, 10),
        startTime: drive.startTime,
        status: drive.status,
        car: drive.car,
      })),
    },
  };
}

export type DealContext = Awaited<ReturnType<typeof getDealContext>>;
