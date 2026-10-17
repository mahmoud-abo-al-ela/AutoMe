import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

/** The request as the server sees it: who Clerk says is signed in, and what the browser sent. */
const request = vi.hoisted(() => ({
  clerkId: null as string | null,
  headers: {} as Record<string, string>,
  cookies: {} as Record<string, string>,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: request.clerkId })),
  currentUser: vi.fn(async () => null),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers(request.headers)),
  cookies: vi.fn(async () => ({
    get: (name: string) => (name in request.cookies ? { name, value: request.cookies[name] } : undefined),
    set: (name: string, value: string) => {
      request.cookies[name] = value;
    },
    delete: (name: string) => {
      delete request.cookies[name];
    },
  })),
}));
// Outside Next there is no cache to refresh, no queue and no storage bucket.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged: vi.fn() }));
vi.mock("@/lib/services/storage", () => ({ deleteCarImages: vi.fn(), uploadCarImages: vi.fn(async () => []) }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { answerBuyerQuestion } from "@/actions/buyer-questions";
import { deleteCar, updateCar } from "@/actions/cars";
import { endImpersonation } from "@/lib/services/impersonation";
import { db } from "@/lib/prisma";

const ORGS = { a: "org_test_forgery_a", b: "org_test_forgery_b", c: "org_test_forgery_c" };
const SLUG = { b: "forgery-test-b" };
const CLERK = { stranger: "clerk_test_forgery_stranger", owner: "clerk_test_forgery_owner", admin: "clerk_test_forgery_admin" };
const ids = { stranger: "", owner: "", admin: "", carB: "", carC: "", questionB: "" };

/** Every cookie and header the old middleware trusted, naming dealership B. */
function forgedFor(slug: string, userId: string) {
  return {
    cookies: { "x-impersonated-org": slug, "x-impersonated-user": userId, "x-impersonation-session": "made-up" },
    headers: {
      "x-impersonation-active": "true",
      "x-impersonated-org": slug,
      "x-impersonated-user": userId,
      "x-impersonation-session": "made-up",
      "x-organization-slug": slug,
    },
  };
}

function signIn(clerkId: string | null, sent: { cookies?: Record<string, string>; headers?: Record<string, string> } = {}) {
  request.clerkId = clerkId;
  request.cookies = { ...(sent.cookies ?? {}) };
  request.headers = { ...(sent.headers ?? {}) };
}

function car(organizationId: string) {
  return db.car.create({
    data: {
      organizationId,
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 500_000,
      mileage: 10_000,
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "White",
      bodyType: "Sedan",
      status: "AVAILABLE",
      images: [],
      features: [],
      featuresAr: [],
    },
  });
}

describe.skipIf(!hasTestDb)("forged impersonation (real Postgres, real actions)", () => {
  beforeAll(async () => {
    await db.auditLog.deleteMany({ where: { organizationId: { in: Object.values(ORGS) } } });
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.organization.createMany({
      data: [
        { id: ORGS.a, name: "Forgery A Motors", slug: "forgery-test-a", isActive: true },
        { id: ORGS.b, name: "Forgery B Motors", slug: SLUG.b, isActive: true },
        { id: ORGS.c, name: "Forgery C Motors", slug: "forgery-test-c", isActive: true },
      ],
    });
    for (const [key, clerkId] of Object.entries(CLERK)) {
      const user = await db.user.create({
        data: { clerkId, email: `forgery-${key}@test.local`, name: `Forgery ${key}`, role: key === "admin" ? "ADMIN" : "USER" },
      });
      ids[key as keyof typeof CLERK] = user.id;
    }
    await db.membership.createMany({
      data: [
        { userId: ids.stranger, organizationId: ORGS.a, role: "OWNER" },
        { userId: ids.owner, organizationId: ORGS.b, role: "OWNER" },
      ],
    });
    ids.carB = (await car(ORGS.b)).id;
    ids.carC = (await car(ORGS.c)).id;
    ids.questionB = (
      await db.buyerQuestion.create({
        data: { organizationId: ORGS.b, carId: ids.carB, question: "Is it still available?", questionKey: "is it still available", locale: "en" },
      })
    ).id;
  });

  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { organizationId: { in: Object.values(ORGS) } } });
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.$disconnect();
  });

  beforeEach(() => signIn(null));

  const carB = () => db.car.findUnique({ where: { id: ids.carB } });

  describe("a member of another dealership forging every impersonation cookie and header", () => {
    beforeEach(() => signIn(CLERK.stranger, forgedFor(SLUG.b, ids.owner)));

    it("cannot answer the dealership's buyer questions", async () => {
      const result = await answerBuyerQuestion({ id: ids.questionB, answer: "Call 0100 000 0000", appliesToAllCars: true });

      expect(result).toMatchObject({ success: false });
      expect(await db.buyerQuestion.findUnique({ where: { id: ids.questionB } })).toMatchObject({
        organizationId: ORGS.b,
        status: "OPEN",
        answer: null,
        answeredById: null,
      });
    });

    it("cannot change the dealership's car", async () => {
      expect(await updateCar(ids.carB, { status: "SOLD" })).toMatchObject({ success: false });
      expect(await carB()).toMatchObject({ organizationId: ORGS.b, status: "AVAILABLE" });
    });

    it("cannot delete the dealership's car", async () => {
      expect(await deleteCar(ids.carB)).toMatchObject({ success: false });
      expect(await carB()).toMatchObject({ organizationId: ORGS.b });
    });
  });

  describe("a platform ADMIN", () => {
    it("without a support session cannot change a dealership's car, forged headers or not", async () => {
      signIn(CLERK.admin);
      expect(await updateCar(ids.carB, { status: "SOLD" })).toMatchObject({ success: false });

      signIn(CLERK.admin, forgedFor(SLUG.b, ids.owner));
      expect(await updateCar(ids.carB, { status: "SOLD" })).toMatchObject({ success: false });
      expect(await deleteCar(ids.carB)).toMatchObject({ success: false });

      expect(await carB()).toMatchObject({ organizationId: ORGS.b, status: "AVAILABLE" });
    });

    it("in a verified session acts in that dealership, credited to the admin, and only until it ends", async () => {
      const session = await db.impersonationSession.create({
        data: { superAdminId: ids.admin, targetUserId: ids.owner, targetOrganizationId: ORGS.b, reason: "forgery test support" },
      });
      signIn(CLERK.admin, { cookies: { "x-impersonation-session": session.id } });

      expect(await updateCar(ids.carB, { status: "SOLD" })).toMatchObject({ success: true });
      expect(await carB()).toMatchObject({ organizationId: ORGS.b, status: "SOLD" });

      // The write is the admin's, inside that session — not the dealer's.
      const entry = await db.auditLog.findFirst({
        where: { organizationId: ORGS.b, entityId: ids.carB },
        orderBy: { createdAt: "desc" },
      });
      expect(entry).toMatchObject({ userId: ids.admin });
      expect(entry?.metadata).toMatchObject({ impersonationSessionId: session.id });

      // Edits yes, deletions no: those stay the dealership's own decision.
      expect(await deleteCar(ids.carB)).toMatchObject({ success: false, error: { code: "AUTHORIZATION_ERROR" } });
      expect(await carB()).toMatchObject({ organizationId: ORGS.b });

      // A session for B reaches nothing in C.
      expect(await updateCar(ids.carC, { status: "SOLD" })).toMatchObject({ success: false });
      expect(await db.car.findUnique({ where: { id: ids.carC } })).toMatchObject({ organizationId: ORGS.c, status: "AVAILABLE" });

      await endImpersonation(session.id, "forgery-admin@test.local");
      // Same browser, cookie re-sent: the ended row is what decides.
      signIn(CLERK.admin, { cookies: { "x-impersonation-session": session.id } });
      expect(await updateCar(ids.carB, { status: "AVAILABLE" })).toMatchObject({ success: false });
      expect(await carB()).toMatchObject({ status: "SOLD" });
    });
  });
});
