import { db } from "@/lib/prisma";

/**
 * The public URLs the sitemap lists, with only the columns it needs.
 *
 * A single sitemap file holds at most 50,000 URLs and every page here is
 * listed once per locale, so these caps keep the whole file under that limit
 * (2 × (20,000 + 4,000) plus the static pages). Past them, split the route
 * with `generateSitemaps` rather than raising the numbers. Most recently
 * changed first, so a cap that does bite drops the stalest listings.
 */
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
