import { db } from "@/lib/prisma";

export const SITEMAP_CAR_LIMIT = 20_000;
export const SITEMAP_DEALERSHIP_LIMIT = 4_000;

/** Visible on the marketplace: the same rules the public listings apply. */
const LISTED_ORGANIZATION = { isActive: true, deletedAt: null } as const;

export async function findSitemapCars() {
  return db.car.findMany({
    where: { status: "AVAILABLE", organization: LISTED_ORGANIZATION },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: SITEMAP_CAR_LIMIT,
  });
}

export async function findSitemapDealerships() {
  return db.organization.findMany({
    where: LISTED_ORGANIZATION,
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: SITEMAP_DEALERSHIP_LIMIT,
  });
}
