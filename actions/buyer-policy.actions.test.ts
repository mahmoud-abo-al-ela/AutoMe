import { describe, it, expect, vi, beforeEach } from "vitest";

// The buyer actions, run through their composed exports so withAuth is part of
// what runs. The point of each blocked case is that nothing was written: the
// row (or Stream channel) a buyer action would create is asserted not created.
vi.mock("@/lib/auth", () => ({ resolveAuthContext: vi.fn(), resolveTenantContext: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/super-admin/auth", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceRateLimit: vi.fn() }));
vi.mock("@/lib/utils/revalidate", () => ({
  revalidateLocalized: vi.fn(),
  revalidateRouteTree: vi.fn(),
}));
vi.mock("@/lib/getOrganization", () => ({
  getCurrentOrganization: vi.fn(),
  getOrganization: vi.fn(),
}));
vi.mock("@/lib/services/notification", () => ({
  sendTestDriveConfirmationEmail: vi.fn(),
  sendTestDriveAdminNotificationEmail: vi.fn(),
  sendTestDriveStatusUpdateEmail: vi.fn(),
}));

const userRepo = vi.hoisted(() => ({
  findUserByClerkId: vi.fn(),
  isCarInWishlist: vi.fn(),
  addCarToWishlist: vi.fn(),
  removeCarFromWishlist: vi.fn(),
}));
vi.mock("@/lib/repositories/user", () => userRepo);

const carRepo = vi.hoisted(() => ({ findCarById: vi.fn() }));
vi.mock("@/lib/repositories/car", () => carRepo);

const testDriveService = vi.hoisted(() => ({
  requestTestDrive: vi.fn(),
  editTestDrive: vi.fn(),
  cancelTestDrive: vi.fn(),
}));
vi.mock("@/lib/services/test-drive", () => testDriveService);

const dealershipService = vi.hoisted(() => ({ createDealershipReview: vi.fn() }));
vi.mock("@/lib/services/dealership", () => dealershipService);

const stream = vi.hoisted(() => ({
  generateStreamToken: vi.fn(),
  upsertStreamUser: vi.fn(),
  createCarInquiryChannel: vi.fn(),
  addMembersToChannel: vi.fn(),
  ensureOrgMembersInStream: vi.fn(),
}));
vi.mock("@/lib/stream-chat", () => stream);

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  car: { findUnique: vi.fn() },
  organization: { findUnique: vi.fn() },
  testDrive: { findUnique: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ db }));

import { resolveAuthContext } from "@/lib/auth";
import type { AuthContext } from "@/lib/auth/context";
import { toggleWishlist } from "@/actions/cars-listing";
import { startCarConversation } from "@/actions/stream-chat";
import { requestTestDrive, cancelTestDriveByUser } from "@/actions/test-drive";
import { createDealershipReview } from "@/actions/dealerships";

const DEALER = "org-dealer";
const CAR = { id: "car-1", organizationId: DEALER };

const viewers = {
  admin: { id: "u-admin", role: "ADMIN", memberships: [] },
  ownStaff: { id: "u-own", role: "USER", memberships: [{ organizationId: DEALER }] },
  otherStaff: { id: "u-other", role: "USER", memberships: [{ organizationId: "org-other" }] },
  impersonating: {
    id: "u-own",
    role: "USER",
    memberships: [{ organizationId: DEALER }],
    isImpersonated: true,
  },
  buyer: { id: "u-buyer", role: "USER", memberships: [] },
};

function signInAs(user: (typeof viewers)[keyof typeof viewers]) {
  vi.mocked(resolveAuthContext).mockResolvedValue({
    userId: `clerk_${user.id}`,
    user,
  } as unknown as AuthContext);
}

function expectBlocked(response: unknown, reason: string) {
  expect(response).toMatchObject({
    success: false,
    error: { code: "AUTHORIZATION_ERROR", messageKey: `errors.buyer.${reason}` },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  userRepo.findUserByClerkId.mockImplementation(async (clerkId: string) => ({ id: clerkId }));
  carRepo.findCarById.mockResolvedValue(CAR);
});

describe("toggleWishlist", () => {
  it.each([
    ["admin", "platformAdmin"],
    ["ownStaff", "ownDealership"],
    ["impersonating", "impersonating"],
  ] as const)("refuses to save for %s", async (who, reason) => {
    signInAs(viewers[who]);
    userRepo.isCarInWishlist.mockResolvedValue(false);

    expectBlocked(await toggleWishlist(CAR.id), reason);
    expect(userRepo.addCarToWishlist).not.toHaveBeenCalled();
  });

  it("lets an admin remove a car saved before", async () => {
    signInAs(viewers.admin);
    userRepo.isCarInWishlist.mockResolvedValue(true);

    const response = await toggleWishlist(CAR.id);

    expect(response).toMatchObject({ success: true, data: { isWishlisted: false } });
    expect(userRepo.removeCarFromWishlist).toHaveBeenCalled();
  });

  it("lets another dealership's team save the car", async () => {
    signInAs(viewers.otherStaff);
    userRepo.isCarInWishlist.mockResolvedValue(false);

    expect(await toggleWishlist(CAR.id)).toMatchObject({ success: true });
    expect(userRepo.addCarToWishlist).toHaveBeenCalledWith("clerk_u-other", CAR.id);
  });
});

describe("startCarConversation", () => {
  beforeEach(() => {
    db.car.findUnique.mockResolvedValue({ ...CAR, organization: { id: DEALER, memberships: [] } });
  });

  it.each([
    ["admin", "platformAdmin"],
    ["ownStaff", "ownDealership"],
    ["impersonating", "impersonating"],
  ] as const)("opens no channel for %s", async (who, reason) => {
    signInAs(viewers[who]);
    db.user.findUnique.mockResolvedValue(viewers[who]);

    expectBlocked(await startCarConversation(CAR.id), reason);
    expect(stream.createCarInquiryChannel).not.toHaveBeenCalled();
  });

  it("opens one for a buyer", async () => {
    signInAs(viewers.buyer);
    db.user.findUnique.mockResolvedValue(viewers.buyer);
    stream.createCarInquiryChannel.mockResolvedValue({ channelId: "ch-1" });

    expect(await startCarConversation(CAR.id)).toMatchObject({ success: true, data: { channelId: "ch-1" } });
  });
});

describe("requestTestDrive", () => {
  const booking = { carId: CAR.id, date: "2026-10-20", startTime: "10:00", endTime: "11:00" };

  it.each([
    ["admin", "platformAdmin"],
    ["ownStaff", "ownDealership"],
    ["impersonating", "impersonating"],
  ] as const)("books nothing for %s", async (who, reason) => {
    signInAs(viewers[who]);

    expectBlocked(await requestTestDrive(booking), reason);
    expect(testDriveService.requestTestDrive).not.toHaveBeenCalled();
  });

  it("refuses to cancel a booking while impersonating", async () => {
    signInAs(viewers.impersonating);

    expectBlocked(await cancelTestDriveByUser("td-1"), "impersonating");
    expect(testDriveService.cancelTestDrive).not.toHaveBeenCalled();
  });
});

describe("createDealershipReview", () => {
  const review = { rating: 5, title: "Great", comment: "Smooth purchase, honest prices." };

  it.each([
    ["admin", "platformAdmin"],
    ["ownStaff", "ownDealership"],
    ["otherStaff", "dealerReview"],
    ["impersonating", "impersonating"],
  ] as const)("writes no review for %s", async (who, reason) => {
    signInAs(viewers[who]);

    expectBlocked(await createDealershipReview(DEALER, review), reason);
    expect(dealershipService.createDealershipReview).not.toHaveBeenCalled();
  });

  it("writes one for a buyer", async () => {
    signInAs(viewers.buyer);
    dealershipService.createDealershipReview.mockResolvedValue({ message: "ok" });

    expect(await createDealershipReview(DEALER, review)).toMatchObject({ success: true });
    expect(dealershipService.createDealershipReview).toHaveBeenCalledWith(DEALER, "clerk_u-buyer", expect.any(Object));
  });
});
