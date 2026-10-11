// Chat repository - the reads that open a buyer's conversation with a dealership.
import { db } from "@/lib/prisma";

/** A car with its dealership and every member's user — everyone the conversation is with. */
export async function findCarWithOrganizationMembers(carId: string) {
  return db.car.findUnique({
    where: { id: carId },
    include: {
      organization: {
        include: {
          memberships: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
}

/** A dealership with every member's user. */
export async function findOrganizationWithMembers(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
    },
  });
}
