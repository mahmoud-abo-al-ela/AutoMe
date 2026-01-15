import { createAuditLog } from "./audit";

/**
 * Car audit log helpers
 */

export async function logCarCreated(car, userId, userEmail) {
  return createAuditLog({
    action: "CAR_CREATED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId,
    userEmail,
    newValue: {
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
    },
  });
}

export async function logCarUpdated(car, oldData, userId, userEmail) {
  return createAuditLog({
    action: "CAR_UPDATED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId,
    userEmail,
    oldValue: oldData,
    newValue: {
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      status: car.status,
    },
  });
}

export async function logCarDeleted(car, userId, userEmail) {
  return createAuditLog({
    action: "CAR_DELETED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId,
    userEmail,
    oldValue: { make: car.make, model: car.model, year: car.year },
  });
}

export async function logCarStatusChanged(car, oldStatus, userId, userEmail) {
  return createAuditLog({
    action: "CAR_STATUS_CHANGED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId,
    userEmail,
    oldValue: { status: oldStatus },
    newValue: { status: car.status },
  });
}

export async function logCarFeaturedToggled(car, userId, userEmail) {
  return createAuditLog({
    action: "CAR_FEATURED_TOGGLED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId,
    userEmail,
    newValue: { featured: car.featured },
  });
}
