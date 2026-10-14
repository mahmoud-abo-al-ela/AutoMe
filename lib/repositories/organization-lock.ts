import type { Prisma } from "@/lib/generated/prisma";

/**
 * Serialize, per dealership, the writes that must respect a plan limit: a
 * transaction-scoped Postgres advisory lock on "<organizationId>:<resource>".
 * Held only for the count and the insert — never across uploads or model
 * calls — and released when the transaction ends. A key collision between
 * two dealerships would only serialize them, never let either past its limit.
 */
export async function lockOrganizationResource(
  tx: Prisma.TransactionClient,
  organizationId: string,
  resource: "cars" | "members"
) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${resource}`}, 0))::text AS "locked"`;
}
