import { db } from "@/lib/prisma";

/**
 * Organization repository for Super Admin operations
 */

export async function findOrganizationById(orgId) {
  return db.organization.findUnique({
    where: { id: orgId },
  });
}

export async function findOrganizationBySlug(slug) {
  return db.organization.findUnique({
    where: { slug },
  });
}

export async function findOrganizationWithSubscription(orgId) {
  return db.organization.findUnique({
    where: { id: orgId },
    include: { subscription: true },
  });
}

export async function findOrganizationForDeletion(orgId) {
  return db.organization.findUnique({
    where: { id: orgId },
    select: { name: true, slug: true },
  });
}

export async function createOrganization(data) {
  return db.organization.create({
    data,
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
}

export async function updateOrganizationStatus(orgId, isActive) {
  return db.organization.update({
    where: { id: orgId },
    data: { isActive },
  });
}

export async function deleteOrganization(orgId) {
  return db.organization.delete({
    where: { id: orgId },
  });
}

/**
 * Delete organization with all related data in a transaction
 */
export async function deleteOrganizationWithRelations(orgId) {
  return db.$transaction(async (tx) => {
    // Delete impersonation sessions
    await tx.impersonationSession.deleteMany({
      where: { targetOrganizationId: orgId },
    });

    // Delete audit logs for this org
    await tx.auditLog.deleteMany({
      where: { organizationId: orgId },
    });

    // Delete test drives
    await tx.testDrive.deleteMany({
      where: { organizationId: orgId },
    });

    // Delete working hours
    await tx.workingHours.deleteMany({
      where: { organizationId: orgId },
    });

    // Delete cars (and their images/saved cars)
    const cars = await tx.car.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    const carIds = cars.map((c) => c.id);

    if (carIds.length > 0) {
      await tx.savedCar.deleteMany({
        where: { carId: { in: carIds } },
      });
    }
    await tx.car.deleteMany({
      where: { organizationId: orgId },
    });

    // Delete memberships
    await tx.membership.deleteMany({
      where: { organizationId: orgId },
    });

    // Delete subscription
    await tx.subscription.deleteMany({
      where: { organizationId: orgId },
    });

    // Finally delete the organization
    await tx.organization.delete({
      where: { id: orgId },
    });
  });
}
