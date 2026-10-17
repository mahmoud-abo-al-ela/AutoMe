import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));
// Outside Next there is no cache to refresh, no queue, no storage bucket and
// no model: a call that got that far is the failure, not the provider.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/jobs", () => ({ enqueue: vi.fn(async () => undefined) }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged: vi.fn() }));
vi.mock("@/lib/services/storage", () => ({ deleteCarImages: vi.fn(), uploadCarImages: vi.fn(async () => []) }));
vi.mock("@/lib/services/ai", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  translateListing: vi.fn(async () => {
    throw new Error("no model in this test");
  }),
  coachListing: vi.fn(async () => {
    throw new Error("no model in this test");
  }),
}));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import * as buyerQuestionActions from "@/actions/buyer-questions";
import * as carActions from "@/actions/cars";
import * as dashboardActions from "@/actions/dashboard";
import * as inventoryActions from "@/actions/inventory";
import * as planActions from "@/actions/plan";
import * as settingsActions from "@/actions/settings";
import * as teamActions from "@/actions/team";
import * as testDriveActions from "@/actions/test-drive";
import { db } from "@/lib/prisma";

const ORGS = { a: "org_test_matrix_a", b: "org_test_matrix_b" };
const SLUG = { a: "matrix-test-a", b: "matrix-test-b" };
const CLERK = {
  outsider: "clerk_test_matrix_outsider",
  ownerA: "clerk_test_matrix_owner_a",
  ownerB: "clerk_test_matrix_owner_b",
  staffB: "clerk_test_matrix_staff_b",
  buyer: "clerk_test_matrix_buyer",
  admin: "clerk_test_matrix_admin",
};
type Person = keyof typeof CLERK;
const user: Record<Person, string> = { outsider: "", ownerA: "", ownerB: "", staffB: "", buyer: "", admin: "" };
const ids = { carA: "", carB: "", questionB: "", driveB: "", staffBMembership: "", sessionA: "" };

const B_ONLY = [
  "Matrix B Motors",
  "matrix-b-car-secret",
  "matrix-b-question-secret",
  "matrix-b-drive-secret",
  "matrix-owner-b@test.local",
  "matrix-staff-b@test.local",
  "matrix-buyer@test.local",
];

const DRIVE_DATE = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

type Scope =
  /** Reads the caller's own dealership: B's data must not be in it. */
  | "read"
  /** Takes a record id: handed B's, it must refuse and change nothing. */
  | "foreign"
  /** Writes the caller's own dealership and takes no record id — refused to outsiders; nothing of B's to hand it. */
  | "own";

interface Row {
  name: string;
  /** withOrgAuth: refused outright to anyone without access to B. withAuth: the caller's own records, checked by the service. */
  guard: "org" | "user";
  scope: Scope;
  call: () => Promise<unknown>;
}

// The actions are typed for their real callers; the matrix only needs to call them.
type AnyAction = (...args: never[]) => Promise<unknown>;
const run = (fn: AnyAction, ...args: unknown[]) => () => (fn as (...a: unknown[]) => Promise<unknown>)(...args);

const fullCar = () => ({
  data: {
    title: "Matrix edit",
    titleEn: "Matrix edit",
    titleAr: "تعديل",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 1,
    mileage: 0,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    color: "Black",
    seats: 5,
    descriptionEn: "Rewritten by someone else",
    descriptionAr: "أعاد كتابته شخص آخر",
    status: "SOLD",
    images: [],
  },
});

const MATRIX: Row[] = [
  // actions/buyer-questions.ts
  { name: "getBuyerQuestions", guard: "org", scope: "read", call: run(buyerQuestionActions.getBuyerQuestions, { view: "OPEN", page: 1 }) },
  { name: "answerBuyerQuestion", guard: "org", scope: "foreign", call: () => buyerQuestionActions.answerBuyerQuestion({ id: ids.questionB, answer: "Call 0100 000 0000", appliesToAllCars: true }) },
  { name: "setBuyerQuestionStatus", guard: "org", scope: "foreign", call: () => buyerQuestionActions.setBuyerQuestionStatus({ id: ids.questionB, status: "DISMISSED" }) },
  // actions/cars.ts
  { name: "getCarPlanLimits", guard: "org", scope: "read", call: run(carActions.getCarPlanLimits) },
  { name: "addCar", guard: "org", scope: "own", call: run(carActions.addCar, fullCar()) },
  { name: "deleteCar", guard: "org", scope: "foreign", call: () => run(carActions.deleteCar, ids.carB)() },
  { name: "updateCar", guard: "org", scope: "foreign", call: () => run(carActions.updateCar, ids.carB, { status: "SOLD", featured: true })() },
  { name: "getCarForEdit", guard: "org", scope: "foreign", call: () => run(carActions.getCarForEdit, ids.carB)() },
  { name: "updateCarFull", guard: "org", scope: "foreign", call: () => run(carActions.updateCarFull, ids.carB, fullCar())() },
  { name: "reviewListingQuality", guard: "org", scope: "own", call: run(carActions.reviewListingQuality, { language: "en", title: "x" }) },
  {
    name: "comparePrice",
    guard: "org",
    scope: "read",
    call: () => run(carActions.comparePrice, { carId: ids.carB, make: "Toyota", model: "Corolla", bodyType: "Sedan", year: 2020, price: 500_000 })(),
  },
  // actions/dashboard.ts
  { name: "getTestDriveTrendsData", guard: "org", scope: "read", call: run(dashboardActions.getTestDriveTrendsData) },
  { name: "getTodayBoard", guard: "org", scope: "read", call: run(dashboardActions.getTodayBoard) },
  { name: "getInsights", guard: "org", scope: "read", call: run(dashboardActions.getInsights, { days: 30 }) },
  { name: "getCarsNeedingAttention", guard: "org", scope: "read", call: run(dashboardActions.getCarsNeedingAttention) },
  { name: "getScheduleMonth", guard: "org", scope: "read", call: run(dashboardActions.getScheduleMonth, { month: DRIVE_DATE.slice(0, 7) }) },
  { name: "getScheduleDay", guard: "org", scope: "read", call: run(dashboardActions.getScheduleDay, { date: DRIVE_DATE }) },
  { name: "getDrivesNeedingOutcome", guard: "org", scope: "read", call: run(dashboardActions.getDrivesNeedingOutcome) },
  // Answers for any car id, leaving out one that is not the dealership's — see its own test below.
  { name: "getDealContext", guard: "org", scope: "read", call:() => run(dashboardActions.getDealContext, { buyerId: user.buyer, carId: ids.carB })() },
  // actions/inventory.ts
  { name: "getInventory", guard: "org", scope: "read", call: run(inventoryActions.getInventory, {}) },
  { name: "exportInventory", guard: "org", scope: "read", call: run(inventoryActions.exportInventory, {}) },
  { name: "getInventoryCounts", guard: "org", scope: "read", call: run(inventoryActions.getInventoryCounts) },
  { name: "updateCars", guard: "org", scope: "foreign", call: () => run(inventoryActions.updateCars, { carIds: [ids.carB], status: "SOLD", featured: true })() },
  // actions/plan.ts
  { name: "getPlanGateStatus", guard: "org", scope: "read", call: run(planActions.getPlanGateStatus, "cars") },
  // actions/settings.ts
  { name: "getOrganizationProfile", guard: "org", scope: "read", call: run(settingsActions.getOrganizationProfile) },
  { name: "updateOrganizationProfile", guard: "org", scope: "own", call: run(settingsActions.updateOrganizationProfile, { name: "Taken over" }) },
  { name: "getDealershipTerms", guard: "org", scope: "read", call: run(settingsActions.getDealershipTerms) },
  {
    name: "updateDealershipTerms",
    guard: "org",
    scope: "own",
    call: run(settingsActions.updateDealershipTerms, { offersFinancing: true, financingNote: "taken over", acceptsTradeIn: null, allowsInspection: null, offersDelivery: null }),
  },
  { name: "getEmailPreferences", guard: "org", scope: "read", call: run(settingsActions.getEmailPreferences) },
  { name: "updateEmailPreferences", guard: "org", scope: "own", call: run(settingsActions.updateEmailPreferences, { emailLocale: "en", weeklyDigestEnabled: false }) },
  { name: "getDealershipInfo", guard: "org", scope: "read", call: run(settingsActions.getDealershipInfo) },
  { name: "updateWorkingHours", guard: "org", scope: "own", call: run(settingsActions.updateWorkingHours, [{ dayOfWeek: "MONDAY", openTime: "00:00", closeTime: "01:00", isOpen: true }]) },
  // actions/team.ts
  { name: "inviteTeamMember", guard: "org", scope: "own", call: run(teamActions.inviteTeamMember, { email: "matrix-invitee@test.local", role: "MEMBER" }) },
  { name: "updateMemberRole", guard: "org", scope: "foreign", call: () => run(teamActions.updateMemberRole, { memberId: ids.staffBMembership, newRole: "OWNER" })() },
  { name: "removeMember", guard: "org", scope: "foreign", call: () => run(teamActions.removeMember, { memberId: ids.staffBMembership })() },
  // actions/test-drive.ts — the dealer's one org action, and the by-id
  // actions any signed-in user can call (the service checks whose drive it is).
  { name: "updateTestDriveStatus", guard: "org", scope: "foreign", call: () => run(testDriveActions.updateTestDriveStatus, { testDriveId: ids.driveB, status: "CONFIRMED" })() },
  { name: "getTestDrives", guard: "user", scope: "read", call: run(testDriveActions.getTestDrives, {}) },
  { name: "getTestDriveById", guard: "user", scope: "foreign", call: () => run(testDriveActions.getTestDriveById, ids.driveB)() },
  {
    name: "editTestDrive",
    guard: "user",
    scope: "foreign",
    call: () => run(testDriveActions.editTestDrive, { testDriveId: ids.driveB, date: DRIVE_DATE, startTime: "12:00", endTime: "12:30", notes: "moved" })(),
  },
  { name: "cancelTestDriveByUser", guard: "user", scope: "foreign", call: () => run(testDriveActions.cancelTestDriveByUser, ids.driveB)() },
];

describe("the cross-tenant matrix covers every dealer action", () => {
  it("has a row for each withOrgAuth export in actions/", () => {
    const dir = path.join(process.cwd(), "actions");
    const exported = readdirSync(dir)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .flatMap((file) => [...readFileSync(path.join(dir, file), "utf8").matchAll(/export const (\w+) = withOrgAuth\b/g)].map((m) => m[1]))
      .sort();

    expect(MATRIX.filter((row) => row.guard === "org").map((row) => row.name).sort()).toEqual(exported);
  });
});

/** Each caller's request: who Clerk says it is, and the cookies and headers it sends. */
const CALLERS = {
  outsider: () => ({ clerkId: CLERK.outsider, cookies: {}, headers: { "x-dashboard-org": SLUG.b } }),
  forger: () => ({
    clerkId: CLERK.ownerA,
    cookies: { "x-impersonated-org": SLUG.b, "x-impersonated-user": user.ownerB, "x-impersonation-session": "made-up" },
    headers: {
      "x-impersonation-active": "true",
      "x-impersonated-org": SLUG.b,
      "x-impersonated-user": user.ownerB,
      "x-impersonation-session": "made-up",
      "x-organization-slug": SLUG.b,
    },
  }),
  ownerOfA: () => ({ clerkId: CLERK.ownerA, cookies: {}, headers: { "x-dashboard-org": SLUG.a } }),
  adminInSessionForA: () => ({ clerkId: CLERK.admin, cookies: { "x-impersonation-session": ids.sessionA }, headers: { "x-dashboard-org": SLUG.a } }),
};

function actAs(caller: keyof typeof CALLERS) {
  const sent = CALLERS[caller]();
  request.clerkId = sent.clerkId;
  request.cookies = { ...sent.cookies };
  request.headers = { ...sent.headers };
}

/** Everything B owns, as it stands. Timestamps included: a no-op write still moves updatedAt. */
async function snapshotOfB() {
  const where = { organizationId: ORGS.b };
  const [organization, cars, questions, drives, memberships, saves, hours] = await Promise.all([
    db.organization.findUnique({ where: { id: ORGS.b } }),
    db.car.findMany({ where, orderBy: { id: "asc" } }),
    db.buyerQuestion.findMany({ where, orderBy: { id: "asc" } }),
    db.testDrive.findMany({ where, orderBy: { id: "asc" } }),
    db.membership.findMany({ where, orderBy: { id: "asc" } }),
    db.savedCar.findMany({ where: { car: where }, orderBy: { id: "asc" } }),
    db.workingHours.findMany({ where, orderBy: { id: "asc" } }),
  ]);
  return JSON.stringify({ organization, cars, questions, drives, memberships, saves, hours });
}

function leaked(result: unknown) {
  const text = JSON.stringify(result) ?? "";
  return B_ONLY.filter((marker) => text.includes(marker));
}

async function clearFixtures() {
  await db.auditLog.deleteMany({ where: { organizationId: { in: Object.values(ORGS) } } });
  await db.aiUsage.deleteMany({ where: { organizationId: { in: Object.values(ORGS) } } });
  await db.impersonationSession.deleteMany({ where: { targetOrganizationId: { in: Object.values(ORGS) } } });
  await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
  await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
}

function car(organizationId: string, secret: string) {
  return db.car.create({
    data: {
      organizationId,
      title: `Toyota Corolla ${secret}`,
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
      description: secret,
      descriptionEn: secret,
      images: [],
      features: [],
      featuresAr: [],
    },
  });
}

describe.skipIf(!hasTestDb)("cross-tenant action matrix (real Postgres, real actions)", () => {
  let before = "";

  beforeAll(async () => {
    await clearFixtures();
    await db.organization.createMany({
      data: [
        { id: ORGS.a, name: "Matrix A Motors", slug: SLUG.a, isActive: true },
        { id: ORGS.b, name: "Matrix B Motors", slug: SLUG.b, isActive: true },
      ],
    });
    const emails: Record<Person, string> = {
      outsider: "matrix-outsider@test.local",
      ownerA: "matrix-owner-a@test.local",
      ownerB: "matrix-owner-b@test.local",
      staffB: "matrix-staff-b@test.local",
      buyer: "matrix-buyer@test.local",
      admin: "matrix-admin@test.local",
    };
    for (const person of Object.keys(CLERK) as Person[]) {
      const row = await db.user.create({
        data: { clerkId: CLERK[person], email: emails[person], name: person === "buyer" ? "Matrix Buyer" : `Matrix ${person}`, role: person === "admin" ? "ADMIN" : "USER" },
      });
      user[person] = row.id;
    }
    await db.membership.createMany({
      data: [
        { userId: user.ownerA, organizationId: ORGS.a, role: "OWNER" },
        { userId: user.ownerB, organizationId: ORGS.b, role: "OWNER" },
      ],
    });
    ids.staffBMembership = (await db.membership.create({ data: { userId: user.staffB, organizationId: ORGS.b, role: "MEMBER" } })).id;

    ids.carA = (await car(ORGS.a, "matrix-a-car")).id;
    ids.carB = (await car(ORGS.b, "matrix-b-car-secret")).id;
    ids.questionB = (
      await db.buyerQuestion.create({
        data: { organizationId: ORGS.b, carId: ids.carB, question: "matrix-b-question-secret?", questionKey: "matrix b question secret", locale: "en" },
      })
    ).id;
    ids.driveB = (
      await db.testDrive.create({
        data: {
          organizationId: ORGS.b,
          carId: ids.carB,
          userId: user.buyer,
          date: new Date(`${DRIVE_DATE}T00:00:00Z`),
          startTime: "10:00",
          endTime: "10:30",
          notes: "matrix-b-drive-secret",
        },
      })
    ).id;
    await db.savedCar.create({ data: { userId: user.buyer, carId: ids.carB } });
    ids.sessionA = (
      await db.impersonationSession.create({
        data: { superAdminId: user.admin, targetUserId: user.ownerA, targetOrganizationId: ORGS.a, reason: "cross-tenant matrix" },
      })
    ).id;

    before = await snapshotOfB();
  });

  afterAll(async () => {
    await clearFixtures();
    await db.$disconnect();
  });

  describe.each(["outsider", "forger"] as const)("%s, aimed at B", (caller) => {
    it.each(MATRIX.filter((row) => row.guard === "org").map((row) => [row.name, row] as const))("%s is refused", async (_name, row) => {
      actAs(caller);
      const result = await row.call();

      expect(result).toMatchObject({ success: false, error: { code: "AUTHORIZATION_ERROR" } });
      expect(leaked(result)).toEqual([]);
    });
  });

  describe.each(["ownerOfA", "adminInSessionForA"] as const)("%s, acting in A with B's ids", (caller) => {
    const rows = MATRIX.filter((row) => row.scope !== "own");

    it.each(rows.map((row) => [row.name, row] as const))("%s returns nothing of B's", async (_name, row) => {
      actAs(caller);
      const result = (await row.call()) as { success?: boolean; data?: { count?: number } };

      expect(leaked(result)).toEqual([]);
      if (row.scope === "foreign") {
        // Refused, or — for the bulk update, which skips ids that are not
        // the dealership's — done to nothing.
        if (row.name === "updateCars") {
          expect(result.success === false || result.data?.count === 0).toBe(true);
        } else {
          expect(result).toMatchObject({ success: false });
        }
      }
    });

    it("gets no deal context from B's car: not the car, and not whether the buyer saved it", async () => {
      actAs(caller);
      const result = (await dashboardActions.getDealContext({ buyerId: user.buyer, carId: ids.carB })) as {
        success: boolean;
        data: { car: unknown; buyer: { savedThisAt: unknown; drives: unknown[] } };
      };

      expect(result).toMatchObject({ success: true, data: { car: null, buyer: { savedThisAt: null, drives: [] } } });
    });
  });

  it("left every row of B exactly as it was", async () => {
    expect(await snapshotOfB()).toBe(before);
  });
});
