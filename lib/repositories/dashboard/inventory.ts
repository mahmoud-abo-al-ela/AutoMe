import { db } from "@/lib/prisma";
import { buildCarWhereClause } from "@/lib/repositories/car/filters";
import type { CarStatus, Prisma } from "@/lib/generated/prisma";

export type InventorySort = "listed" | "price" | "saves" | "drives";

export interface InventoryQuery {
  status?: CarStatus;
  search?: string;
  bodyType?: string;
  minYear?: number;
  featured?: boolean;
  sort: InventorySort;
  dir: "asc" | "desc";
  skip: number;
  take: number;
}

const ORDER_BY = {
  listed: (dir: "asc" | "desc") => ({ createdAt: dir }),
  price: (dir: "asc" | "desc") => ({ price: dir }),
  saves: (dir: "asc" | "desc") => ({ savedBy: { _count: dir } }),
  drives: (dir: "asc" | "desc") => ({ testDrive: { _count: dir } }),
} as const;

/**
 * One page of a dealership's own cars for the Cars table, every status, with
 * how many buyers saved each and asked to drive it. The where clause is the
 * listing's (buildCarWhereClause), so the dealer's search matches what a
 * buyer's does — Arabic make names included. Ties break on id so a page never
 * repeats or skips a car.
 */
export async function findInventory(organizationId: string, query: InventoryQuery) {
  // The builder is still JavaScript, so its clause is typed here; it builds
  // only Prisma filters, and its "insensitive" modes are QueryMode values.
  const where = buildCarWhereClause({
    organizationId,
    onlyAvailable: false,
    status: query.status,
    search: query.search,
    bodyType: query.bodyType,
    minYear: query.minYear,
    featured: query.featured,
  }) as Prisma.CarWhereInput;

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      orderBy: [ORDER_BY[query.sort](query.dir), { id: "asc" }],
      skip: query.skip,
      take: query.take,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        bodyType: true,
        title: true,
        titleEn: true,
        titleAr: true,
        price: true,
        priceCurrency: true,
        images: true,
        status: true,
        featured: true,
        createdAt: true,
        _count: { select: { savedBy: true, testDrive: true } },
      },
    }),
    db.car.count({ where }),
  ]);

  return {
    total,
    cars: cars.map(({ price, _count, ...car }) => ({
      ...car,
      price: Number(price),
      saves: _count.savedBy,
      testDrives: _count.testDrive,
    })),
  };
}

/** How many of the dealership's cars are in each status — the counts on the Cars page's views. */
export async function countInventoryByStatus(organizationId: string) {
  return db.car.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } });
}
