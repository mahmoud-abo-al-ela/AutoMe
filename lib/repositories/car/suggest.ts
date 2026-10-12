// Car repository - what the search box suggests as a buyer types. Public
// listings only, by the same rule the public search applies: available cars
// of active, undeleted dealerships. Nothing here depends on who is asking.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

const PUBLIC = Prisma.sql`
  FROM "Car" c JOIN "Organization" o ON o."id" = c."organizationId"
  WHERE c."status" = 'AVAILABLE' AND o."isActive" AND o."deletedAt" IS NULL`;

export interface MakeModelCount {
  make: string;
  model: string;
  count: number;
}

/**
 * Every make and model listed publicly, with how many cars. One grouped scan:
 * there are far fewer pairs than cars, and the suggestions match them in
 * memory, by name in either language.
 */
export function countPublicMakeModels(): Promise<MakeModelCount[]> {
  return db.$queryRaw<MakeModelCount[]>(Prisma.sql`
    SELECT c."make", c."model", count(*)::int AS "count"
    ${PUBLIC}
    GROUP BY c."make", c."model"
  `);
}
