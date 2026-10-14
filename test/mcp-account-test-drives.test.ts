import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});
// cookies too: the audit trail asks the request whether it is in a support
// session (lib/services/impersonation/active.ts). None here.
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));
const mail = vi.hoisted(() => ({ confirmation: vi.fn(async () => null), dealer: vi.fn(async () => null) }));
vi.mock("@/lib/services/notification", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendTestDriveConfirmationEmail: mail.confirmation,
  sendTestDriveAdminNotificationEmail: mail.dealer,
}));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { resolveAccountCaller } from "@/lib/services/mcp/account";
import { cancelTestDriveFor, mcpClientLabel, requestTestDriveFor } from "@/lib/services/mcp/account-test-drives";
import { addDays } from "@/lib/utils/date-only";
import { cairoNow } from "@/lib/utils/datetime";
import { AuthorizationError, NotFoundError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";

/**
 * Test drives through the signed-in MCP endpoint, on Postgres: the site's own
 * booking path (buyer policy, race-safe slots), plus what no person clicked
 * — the app named in the buyer's email, and an entry in the dealer's log.
 */

const ORG = "org_test_mcp_drives";
const BUYER = "user_test_mcp_drives_buyer";
const OTHER = "user_test_mcp_drives_other";
const STAFF = "user_test_mcp_drives_staff";
const clerk = (id: string) => `clerk_${id}`;
const DAY = addDays(cairoNow().date, 2);
let carId = "";
let secondCarId = "";

async function cleanUp() {
  await db.auditLog.deleteMany({ where: { organizationId: ORG } });
  await db.organization.deleteMany({ where: { id: ORG } });
  await db.user.deleteMany({ where: { id: { in: [BUYER, OTHER, STAFF] } } });
}

const caller = async (id: string) => (await resolveAccountCaller(clerk(id)))!;
const ask = async (id: string, startTime: string, endTime: string, car = carId) =>
  requestTestDriveFor(await caller(id), { carId: car, date: DAY, startTime, endTime, notes: "via MCP" }, "Claude", "en");

describe.skipIf(!hasTestDb)("test drives through the account MCP endpoint (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.create({ data: { id: ORG, name: "Drive Motors", slug: "test-mcp-drives", isActive: true, email: "drives-dealer@example.com" } });
    await db.user.createMany({
      data: [
        { id: BUYER, clerkId: clerk(BUYER), email: "drives-buyer@example.com", name: "Buyer" },
        { id: OTHER, clerkId: clerk(OTHER), email: "drives-other@example.com", name: "Other" },
        { id: STAFF, clerkId: clerk(STAFF), email: "drives-staff@example.com", name: "Staff" },
      ],
    });
    await db.membership.create({ data: { userId: STAFF, organizationId: ORG, role: "MEMBER" } });
    await db.workingHours.create({
      data: {
        organizationId: ORG,
        dayOfWeek: ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        openTime: "09:00",
        closeTime: "17:00",
        isOpen: true,
      },
    });
    const car = () =>
      db.car.create({
        data: {
          organizationId: ORG, make: "Kia", model: "Cerato", year: 2019, price: 700_000, mileage: 60_000,
          fuelType: "Gasoline", transmission: "Automatic", color: "Black", bodyType: "Sedan",
          status: "AVAILABLE", images: [], features: [],
        },
      });
    carId = (await car()).id;
    secondCarId = (await car()).id;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.testDrive.deleteMany({ where: { organizationId: ORG } });
    await db.auditLog.deleteMany({ where: { organizationId: ORG } });
  });

  afterAll(cleanUp);

  it("books a slot, e-mails the buyer naming the app, and logs it for the dealer", async () => {
    const result = await ask(BUYER, "10:00", "11:00");

    expect(result).toMatchObject({ requested: true, created: true, testDrive: { status: "PENDING", date: DAY, startTime: "10:00" } });
    expect(await db.testDrive.count({ where: { carId, userId: BUYER, status: "PENDING" } })).toBe(1);
    expect(mail.confirmation).toHaveBeenCalledWith(expect.objectContaining({ requestedVia: "Claude" }));
    expect(mail.dealer).toHaveBeenCalledOnce();
    const entry = await db.auditLog.findFirst({ where: { organizationId: ORG, action: "TEST_DRIVE_CREATED" } });
    expect(entry).toMatchObject({ userId: BUYER, metadata: expect.objectContaining({ source: "mcp", client: "Claude" }) });
  });

  it("answers the same request again with the same booking, without e-mailing twice", async () => {
    const first = await ask(BUYER, "10:00", "11:00");
    vi.clearAllMocks();
    const again = await ask(BUYER, "10:00", "11:00");
    expect(again).toMatchObject({ requested: true, created: false, testDrive: { id: first.testDrive!.id } });
    expect(mail.confirmation).not.toHaveBeenCalled();
    expect(await db.testDrive.count({ where: { carId, userId: BUYER } })).toBe(1);
  });

  it("refuses a second slot for a car already booked, naming the booking", async () => {
    const first = await ask(BUYER, "10:00", "11:00");
    expect(await ask(BUYER, "14:00", "15:00")).toMatchObject({ requested: false, reason: "already_booked", testDrive: { id: first.testDrive!.id } });
    expect(await db.testDrive.count({ where: { carId, userId: BUYER } })).toBe(1);
  });

  it("answers why a time cannot be booked — taken, or outside the dealership's hours", async () => {
    await ask(OTHER, "10:00", "11:00");
    expect(await ask(BUYER, "10:30", "11:30")).toEqual({ requested: false, reason: "taken" });
    expect(await ask(BUYER, "18:00", "19:00", secondCarId)).toEqual({ requested: false, reason: "outsideHours" });
    expect(await db.testDrive.count({ where: { userId: BUYER } })).toBe(0);
  });

  it("refuses the dealership's own staff, as the site does", async () => {
    await expect(ask(STAFF, "10:00", "11:00")).rejects.toBeInstanceOf(AuthorizationError);
    expect(await db.testDrive.count({ where: { userId: STAFF } })).toBe(0);
  });

  it("cancels the caller's own booking once, logs it, and never touches another's", async () => {
    const mine = await ask(BUYER, "10:00", "11:00");
    const theirs = await ask(OTHER, "13:00", "14:00", secondCarId);

    expect(await cancelTestDriveFor(await caller(BUYER), mine.testDrive!.id, "Claude", "en")).toMatchObject({ cancelled: true, changed: true });
    expect(await cancelTestDriveFor(await caller(BUYER), mine.testDrive!.id, "Claude", "en")).toMatchObject({ cancelled: true, changed: false });
    expect(await db.auditLog.count({ where: { organizationId: ORG, action: "TEST_DRIVE_CANCELED" } })).toBe(1);

    await expect(cancelTestDriveFor(await caller(BUYER), theirs.testDrive!.id, "Claude", "en")).rejects.toBeInstanceOf(NotFoundError);
    expect((await db.testDrive.findUnique({ where: { id: theirs.testDrive!.id } }))?.status).toBe("PENDING");
  });
});

describe("mcpClientLabel", () => {
  it("names Anthropic's apps, and no one else", () => {
    expect(mcpClientLabel("https://claude.ai/oauth/mcp-oauth-client-metadata")).toBe("Claude");
    expect(mcpClientLabel("https://claude.ai/oauth/claude-code-client-metadata")).toBe("Claude");
    expect(mcpClientLabel("https://evil.example/claude.ai")).toBeNull();
    expect(mcpClientLabel("client_2abc")).toBeNull();
    expect(mcpClientLabel(null)).toBeNull();
  });
});
