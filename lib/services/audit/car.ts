import type { AuditAction } from "@/lib/generated/prisma";
import { createAuditLog } from "./audit";

/**
 * Car audit entries, for the dealer's Activity page. Each records only the
 * fields that changed, before and after, plus the car's make, model and year
 * in `metadata.car` — so the entry still names the car after it is deleted.
 */

/** Who made the change: the database User, not the Clerk id. */
export interface AuditActor {
  id?: string | null;
  email?: string | null;
}

interface AuditCar {
  id: string;
  organizationId: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: unknown;
  mileage?: number | null;
  status?: string | null;
  featured?: boolean | null;
}

/** The fields the Activity page can describe, in the order it lists them. */
const TRACKED = ["make", "model", "year", "price", "mileage", "status", "featured"] as const;
type Tracked = (typeof TRACKED)[number];

/** A price arrives as a Prisma Decimal; the log stores a plain number. */
function plain(field: Tracked, value: unknown) {
  if (value === undefined || value === null) return null;
  return field === "price" ? Number(value) : value;
}

const nameOf = (car: AuditCar) => ({ make: car.make ?? null, model: car.model ?? null, year: car.year ?? null });

export async function logCarCreated(car: AuditCar, actor: AuditActor) {
  return createAuditLog({
    action: "CAR_CREATED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId: actor.id,
    userEmail: actor.email,
    newValue: { price: plain("price", car.price), status: car.status ?? null },
    metadata: { car: nameOf(car) },
  });
}

/**
 * One car edited. A change to the status alone, or the featured flag alone, is
 * logged as that; anything else as an edit. Nothing is logged when nothing the
 * page describes changed (a new photo, say).
 */
export async function logCarChanged(before: AuditCar, after: AuditCar, actor: AuditActor) {
  const changed = TRACKED.filter(
    (field) => after[field] !== undefined && plain(field, before[field]) !== plain(field, after[field]),
  );
  if (changed.length === 0) return null;

  const action: AuditAction =
    changed.length === 1 && changed[0] === "status"
      ? "CAR_STATUS_CHANGED"
      : changed.length === 1 && changed[0] === "featured"
        ? "CAR_FEATURED_TOGGLED"
        : "CAR_UPDATED";

  return createAuditLog({
    action,
    entityType: "CAR",
    entityId: before.id,
    organizationId: before.organizationId,
    userId: actor.id,
    userEmail: actor.email,
    oldValue: Object.fromEntries(changed.map((field) => [field, plain(field, before[field])])),
    newValue: Object.fromEntries(changed.map((field) => [field, plain(field, after[field])])),
    // Named as it is now: an edit to the make or model shows under the new name.
    metadata: { car: { make: after.make ?? before.make ?? null, model: after.model ?? before.model ?? null, year: after.year ?? before.year ?? null } },
  });
}

export async function logCarDeleted(car: AuditCar, actor: AuditActor) {
  return createAuditLog({
    action: "CAR_DELETED",
    entityType: "CAR",
    entityId: car.id,
    organizationId: car.organizationId,
    userId: actor.id,
    userEmail: actor.email,
    oldValue: { price: plain("price", car.price), status: car.status ?? null },
    metadata: { car: nameOf(car) },
  });
}
