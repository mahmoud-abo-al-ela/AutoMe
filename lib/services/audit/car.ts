import { createAuditLog } from "./audit";

/**
 * Car audit log helpers
 */

interface AuditCar {
  id: string;
  organizationId: string;
  make?: string;
  model?: string;
  year?: number;
  price?: unknown;
  status?: string;
  featured?: boolean;
}

export async function logCarCreated(car: AuditCar, userId?: string | null, userEmail?: string | null) {
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

export async function logCarUpdated(car: AuditCar, oldData: Record<string, unknown>, userId?: string | null, userEmail?: string | null) {
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

export async function logCarDeleted(car: AuditCar, userId?: string | null, userEmail?: string | null) {
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

export async function logCarStatusChanged(car: AuditCar, oldStatus: string, userId?: string | null, userEmail?: string | null) {
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

export async function logCarFeaturedToggled(car: AuditCar, userId?: string | null, userEmail?: string | null) {
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
