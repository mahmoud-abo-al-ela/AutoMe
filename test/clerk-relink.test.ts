import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const session = vi.hoisted(() => ({
  userId: null as string | null,
  clerkUser: null as null | { externalId: string | null; firstName: string; lastName: string; imageUrl: string; emailAddresses: { emailAddress: string }[] },
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: session.userId })),
  currentUser: vi.fn(async () => session.clerkUser),
}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { checkUser } from "@/lib/checkUser";
import { applyClerkUserEvent, relinkMigratedUser } from "@/lib/services/user/clerk-sync";
import { db } from "@/lib/prisma";

/**
 * Moving AutoMe from Clerk's development instance to its production one
 * gives every person a new Clerk ID. The copy carries the old one as its
 * external_id (scripts/clerk/migrate-users.ts), and whichever path meets the
 * new ID first — the person's first sign-in, or Clerk's user.created webhook
 * — must hand them their existing row, with everything hanging off it,
 * rather than create a second one (which the unique email would refuse).
 */

const ORG = "org_test_clerk_relink";
const OLD = "user_dev_relink_old";
const NEW = "user_prod_relink_new";
const EMAIL = "relink-buyer@example.com";

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: ORG } });
  await db.user.deleteMany({ where: { clerkId: { in: [OLD, NEW, "user_prod_other"] } } });
}

async function seedDevRow() {
  const user = await db.user.create({ data: { clerkId: OLD, email: EMAIL, name: "Relink Buyer" } });
  await db.organization.create({ data: { id: ORG, name: "Relink Motors", slug: "test-clerk-relink" } });
  await db.membership.create({ data: { userId: user.id, organizationId: ORG, role: "OWNER" } });
  return user.id;
}

const signInAs = (clerkId: string, externalId: string | null) => {
  session.userId = clerkId;
  session.clerkUser = { externalId, firstName: "Relink", lastName: "Buyer", imageUrl: "", emailAddresses: [{ emailAddress: EMAIL }] };
};

describe.skipIf(!hasTestDb)("re-linking accounts copied between Clerk instances (real Postgres)", () => {
  beforeEach(cleanUp);
  afterAll(cleanUp);

  it("hands a copied account its row on first sign-in — memberships and all", async () => {
    const rowId = await seedDevRow();
    signInAs(NEW, OLD);

    const user = await checkUser();

    expect(user?.id).toBe(rowId);
    expect(await db.user.count({ where: { email: EMAIL } })).toBe(1);
    expect((await db.user.findUnique({ where: { id: rowId } }))?.clerkId).toBe(NEW);
    expect(await db.membership.count({ where: { userId: rowId, organizationId: ORG } })).toBe(1);
  });

  it("survives a first page load's concurrent requests: one row, moved once", async () => {
    const rowId = await seedDevRow();
    signInAs(NEW, OLD);
    const users = await Promise.all([checkUser(), checkUser(), checkUser()]);
    expect(users.map((user) => user?.id)).toEqual([rowId, rowId, rowId]);
    expect(await db.user.count({ where: { email: EMAIL } })).toBe(1);
  });

  it("does the same from the user.created webhook, keeping the profile current", async () => {
    const rowId = await seedDevRow();
    const outcome = await applyClerkUserEvent(`msg_relink_${Date.now()}`, {
      type: "user.created",
      data: { id: NEW, external_id: OLD, first_name: "Renamed", last_name: "Buyer", email_addresses: [{ email_address: EMAIL }] },
    });
    expect(outcome).toBe("processed");
    const row = await db.user.findUnique({ where: { id: rowId } });
    expect(row).toMatchObject({ clerkId: NEW, name: "Renamed Buyer" });
  });

  it("creates a row as before for a new person, who has no external ID", async () => {
    signInAs(NEW, null);
    const user = await checkUser();
    expect(user?.email).toBe(EMAIL);
    expect(await db.user.count({ where: { clerkId: NEW } })).toBe(1);
  });

  it("never moves a row onto an ID that already has one, nor for an unknown old ID", async () => {
    await seedDevRow();
    await db.user.create({ data: { clerkId: "user_prod_other", email: "other@example.com" } });
    expect(await relinkMigratedUser("user_prod_other", OLD)).toBe(false);
    expect(await relinkMigratedUser(NEW, "user_dev_nobody")).toBe(false);
    expect(await relinkMigratedUser(NEW, null)).toBe(false);
    expect((await db.user.findFirst({ where: { email: EMAIL } }))?.clerkId).toBe(OLD);
  });
});
