import type { Prisma } from "@/lib/generated/prisma";

export async function lockOrganizationResource(
  tx: Prisma.TransactionClient,
  organizationId: string,
  resource: "cars" | "members"
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${resource}`}, 0))::text AS "locked"`;
}
