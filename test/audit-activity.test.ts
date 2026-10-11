import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

// createAuditLog reads the request's IP and user agent; there is no request here.
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "user-agent": "vitest" }) }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { createAuditLog, recordAdminAuditEntry } from "@/lib/services/audit/audit";
import { getActivity, getUserActivity } from "@/lib/services/audit/activity";
import { db } from "@/lib/prisma";

/**
 * The Activity pages' reads, against real Postgres: a dealership's page names
 * only its own cars and members, while the super-admin's view of a person
 * spans every dealership they acted in.
 */

const ORG = "org_test_audit_a";
const OTHER_ORG = "org_test_audit_b";
const ORGS = [ORG, OTHER_ORG];
const CLERK_IDS = ["clerk_test_audit_owner", "clerk_test_audit_other"];

let ownerId = "";
let otherCarId = "";
let ownCarId = "";

async function car(organizationId: string, model: string) {
  const row = await db.car.create({
    data: {
      organizationId,
      make: "Toyota",
      model,
      year: 2020,
      price: 500_000,
      mileage: 40_000,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      images: [],
      features: [],
    },
  });
  return row.id;
}

describe.skipIf(!hasTestDb)("audit activity (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.user.deleteMany({ where: { clerkId: { in: CLERK_IDS } } });
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Audit Motors", slug: "audit-test-a", isActive: true },
        { id: OTHER_ORG, name: "Other Audit Motors", slug: "audit-test-b", isActive: true },
      ],
    });
    const owner = await db.user.create({ data: { clerkId: CLERK_IDS[0], email: "audit-owner@test.local", name: "Owner" } });
    const other = await db.user.create({ data: { clerkId: CLERK_IDS[1], email: "audit-other@test.local", name: "Other" } });
    ownerId = owner.id;
    await db.membership.createMany({
      data: [
        { userId: owner.id, organizationId: ORG, role: "OWNER" },
        { userId: owner.id, organizationId: OTHER_ORG, role: "MEMBER" },
        { userId: other.id, organizationId: OTHER_ORG, role: "OWNER" },
      ],
    });
    ownCarId = await car(ORG, "Corolla");
    otherCarId = await car(OTHER_ORG, "Camry");

    // The owner acts in both dealerships; one entry here even names the other one's car.
    await createAuditLog({ action: "CAR_CREATED", entityType: "CAR", entityId: ownCarId, organizationId: ORG, userId: owner.id });
    await createAuditLog({ action: "CAR_UPDATED", entityType: "CAR", entityId: otherCarId, organizationId: ORG, userId: owner.id });
    await createAuditLog({ action: "CAR_CREATED", entityType: "CAR", entityId: otherCarId, organizationId: OTHER_ORG, userId: owner.id });
  });

  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { organizationId: { in: ORGS } } });
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.user.deleteMany({ where: { clerkId: { in: CLERK_IDS } } });
    await db.$disconnect();
  });

  it("writes an entry with the request's context", async () => {
    const row = await db.auditLog.findFirst({ where: { organizationId: ORG, entityId: ownCarId } });
    expect(row).toMatchObject({ action: "CAR_CREATED", userId: ownerId, impersonatedBy: null });
    expect(row?.metadata).toMatchObject({ userAgent: "vitest" });
  });

  it("records a super-admin action with the request's context, kept forever", async () => {
    const row = await recordAdminAuditEntry({
      action: "ORG_UPDATED",
      entityType: "ORGANIZATION",
      entityId: OTHER_ORG,
      userId: ownerId,
      userEmail: "audit-owner@test.local",
      organizationId: OTHER_ORG,
      metadata: { isActive: true },
    });
    expect(row).toMatchObject({ retainUntil: null, impersonatedBy: null, metadata: { isActive: true, userAgent: "vitest" } });
    await db.auditLog.delete({ where: { id: row!.id } });
  });

  it("does not fail a super-admin action whose audit entry cannot be written", async () => {
    const entry = { action: "NOT_AN_ACTION", entityType: "ORGANIZATION", entityId: OTHER_ORG } as never;
    await expect(recordAdminAuditEntry(entry)).resolves.toBeNull();
  });

  it("shows a dealership only its own entries, and names only its own cars and members", async () => {
    const activity = await getActivity({ organizationId: ORG, kind: "all", page: 1 });
    expect(activity.entries).toHaveLength(2);
    expect(Object.keys(activity.lookups.cars)).toEqual([ownCarId]);
    expect(activity.people.map((p) => p.id)).toEqual([ownerId]);
  });

  it("follows one person across every dealership, for the super-admin", async () => {
    const activity = await getUserActivity({ userId: ownerId, page: 1 });
    expect(activity.pagination.total).toBe(3);
    expect(new Set(activity.entries.map((e) => e.dealership?.id))).toEqual(new Set(ORGS));
    expect(new Set(Object.keys(activity.lookups.cars))).toEqual(new Set([ownCarId, otherCarId]));
  });
});
