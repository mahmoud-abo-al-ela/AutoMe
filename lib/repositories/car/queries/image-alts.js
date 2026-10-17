// The cars whose photos still need describing, for the image-alt backfill.

import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

/** @param {{ take: number, afterId?: string }} page */
export async function findCarsMissingImageAlts({ take, afterId }) {
  return db.car.findMany({
    where: {
      imageAlts: { equals: Prisma.DbNull },
      images: { isEmpty: false },
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
    select: { id: true, organizationId: true },
    orderBy: { id: "asc" },
    take,
  });
}

/** How many cars findCarsMissingImageAlts has left after `afterId`. */
export async function countCarsMissingImageAlts(afterId) {
  return db.car.count({
    where: {
      imageAlts: { equals: Prisma.DbNull },
      images: { isEmpty: false },
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
  });
}
