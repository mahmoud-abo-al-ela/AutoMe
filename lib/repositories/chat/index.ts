// Chat repository - the reads that open a buyer's conversation with a dealership.
import { db } from "@/lib/prisma";
import { PUBLIC_DEALERSHIP_WHERE, publicCarWhere } from "@/lib/repositories/car/visibility";

/**
 * What a dealership member contributes to a buyer's chat: how they appear in
 * it. Not their email, Clerk id or platform role — Stream shows every
 * channel member's user to every other member.
 */
const CHAT_MEMBER = { select: { id: true, name: true, imageUrl: true } } as const;

/**
 * A car a buyer may see, with its dealership and every member — everyone the
 * conversation is with. Null for a hidden car or a suspended dealership's:
 * the public rule, the same as the car's page.
 */
export async function findCarWithOrganizationMembers(carId: string) {
  return db.car.findFirst({
    where: { id: carId, ...publicCarWhere("detail") },
    include: {
      organization: {
        include: {
          memberships: { include: { user: CHAT_MEMBER } },
        },
      },
    },
  });
}

/** An active dealership with every member. Null for a suspended or deleted one. */
export async function findOrganizationWithMembers(organizationId: string) {
  return db.organization.findFirst({
    where: { id: organizationId, ...PUBLIC_DEALERSHIP_WHERE },
    include: {
      memberships: { include: { user: CHAT_MEMBER } },
    },
  });
}
