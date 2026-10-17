import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import type { CarStatus } from "@/lib/generated/prisma";
import { buildCarWhereClause } from "@/lib/repositories/car/filters";
import { dealerSearchCondition } from "@/lib/repositories/car/search";
import { FROM } from "@/lib/repositories/car/search-words";

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

/** The same orders in SQL, for a searched page (searchedPage). */
const ORDER_SQL: Record<InventorySort, Prisma.Sql> = {
  listed: Prisma.sql`c."createdAt"`,
  price: Prisma.sql`c."price"`,
  saves: Prisma.sql`(SELECT count(*) FROM "SavedCar" s WHERE s."carId" = c."id")`,
  drives: Prisma.sql`(SELECT count(*) FROM "TestDrive" t WHERE t."carId" = c."id")`,
};

const SELECT = {
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
} as const;

export async function findInventory(organizationId: string, query: InventoryQuery) {
  const { cars, total } = query.search?.trim() ? await searchedPage(organizationId, query) : await plainPage(organizationId, query);

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

async function plainPage(organizationId: string, query: InventoryQuery) {
  // The builder is still JavaScript, so its clause is typed here; it builds
  // only Prisma filters, and its "insensitive" modes are QueryMode values.
  const where = buildCarWhereClause({
    organizationId,
    onlyAvailable: false,
    status: query.status,
    bodyType: query.bodyType,
    minYear: query.minYear,
    featured: query.featured,
  }, { scope: "dealer" }) as Prisma.CarWhereInput;

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      orderBy: [ORDER_BY[query.sort](query.dir), { id: "asc" }],
      skip: query.skip,
      take: query.take,
      select: SELECT,
    }),
    db.car.count({ where }),
  ]);
  return { cars, total };
}

async function searchedPage(organizationId: string, query: InventoryQuery) {
  const condition: Prisma.Sql | null = await dealerSearchCondition({
    organizationId,
    status: query.status,
    bodyType: query.bodyType,
    minYear: query.minYear,
    featured: query.featured,
    search: query.search,
  });
  if (!condition) return { cars: [], total: 0 };

  const dir = Prisma.raw(query.dir === "asc" ? "ASC" : "DESC");
  const [page, counted] = await Promise.all([
    db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT c."id" ${FROM}
      WHERE ${condition}
      ORDER BY ${ORDER_SQL[query.sort]} ${dir}, c."id" ASC
      LIMIT ${query.take} OFFSET ${query.skip}
    `),
    db.$queryRaw<{ total: number }[]>(Prisma.sql`SELECT count(*)::int AS "total" ${FROM} WHERE ${condition}`),
  ]);

  const order = new Map(page.map(({ id }, i) => [id, i]));
  const cars = await db.car.findMany({ where: { organizationId, id: { in: [...order.keys()] } }, select: SELECT });
  cars.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { cars, total: counted[0]?.total ?? 0 };
}

/** How many of the dealership's cars are in each status — the counts on the Cars page's views. */
export async function countInventoryByStatus(organizationId: string) {
  return db.car.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } });
}
