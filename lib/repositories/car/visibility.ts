import { Prisma, type CarStatus } from "@/lib/generated/prisma";

// The one definition of what the public may see; builders default to public so a forgetful caller fails closed.
export type VisibilityScope = "public" | "dealer";

/** A dealership that may be shown, as a Prisma organization filter. */
export const PUBLIC_DEALERSHIP_WHERE = { isActive: true, deletedAt: null } satisfies Prisma.OrganizationWhereInput;

/** The same rule over the `o` alias of FROM (search-words.js). */
export const PUBLIC_DEALERSHIP_SQL = Prisma.sql`o."isActive" = true AND o."deletedAt" IS NULL`;

/** Statuses a list shows. */
export const LISTED_STATUSES: readonly CarStatus[] = ["AVAILABLE"];

/** Statuses a car opened by id shows: a sold car's page stays up, marked sold. */
export const DETAIL_STATUSES: readonly CarStatus[] = ["AVAILABLE", "SOLD"];

export type PublicCarKind = "listed" | "detail";

/** The Prisma where for a public car, listed or opened by id. */
export function publicCarWhere(kind: PublicCarKind): Prisma.CarWhereInput {
  return {
    status: { in: [...(kind === "listed" ? LISTED_STATUSES : DETAIL_STATUSES)] },
    organization: { is: PUBLIC_DEALERSHIP_WHERE },
  };
}

/** The same rule over a row already loaded with its dealership's state. */
export function isPubliclyVisibleCar(
  car: { status: CarStatus | string; organization: { isActive: boolean; deletedAt: Date | null } },
  kind: PublicCarKind = "detail"
): boolean {
  const statuses: readonly string[] = kind === "listed" ? LISTED_STATUSES : DETAIL_STATUSES;
  return statuses.includes(car.status) && car.organization.isActive && car.organization.deletedAt === null;
}
