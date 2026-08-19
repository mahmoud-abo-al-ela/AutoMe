import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted so the vi.mock factory below can close over the same instance we
// configure in the tests.
const { db } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    organization: { findMany: vi.fn(), update: vi.fn() },
    membership: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";

// vi.mock replaces these with mock functions; the imported types still describe
// the real implementations, so re-view them as mocks to configure per test.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);
const mockHeaders = vi.mocked(headers as unknown as () => Promise<Headers>);
const mockCurrentUser = vi.mocked(
  currentUser as unknown as () => Promise<unknown>,
);

const nonAdmin = {
  id: "nonadmin-1",
  clerkId: "clerk_nonadmin",
  role: "USER",
  email: "dealer@example.com",
  name: "Dealer",
  memberships: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_nonadmin" });
  db.user.findUnique.mockResolvedValue(nonAdmin);
  db.organization.findMany.mockResolvedValue([]); // no pending orgs to auto-assign
});

describe("checkUser impersonation backstop", () => {
  it("ignores impersonation headers forged by a non-admin", async () => {
    // A non-admin forges the headers, naming some victim as the impersonated user.
    mockHeaders.mockResolvedValue(
      new Headers({
        "x-impersonation-active": "true",
        "x-impersonated-user": "victim-user",
      }),
    );

    const result = await checkUser();
    if (!result) throw new Error("expected a user");

    // The forger stays themselves — the target is never resolved.
    expect(result.id).toBe(nonAdmin.id);
    expect(result.role).toBe("USER");
    expect(result.isImpersonated).toBeFalsy();
    // Only the initial self-lookup ran; the impersonated user was never fetched.
    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe("checkUser with a phone-only Clerk account", () => {
  // Clerk supports phone-only and some passwordless signups, which carry no
  // email address. User.email used to be NOT NULL, so creating these users
  // threw on their first authenticated page load.
  const phoneOnlyClerkUser = {
    id: "clerk_phoneonly",
    firstName: "Mona",
    lastName: "Saleh",
    imageUrl: "https://example.test/avatar.png",
    emailAddresses: [] as { emailAddress: string }[],
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_phoneonly" });
    mockHeaders.mockResolvedValue(new Headers());
    // No local row yet: this is the user's first authenticated request.
    db.user.findUnique.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue(phoneOnlyClerkUser);
  });

  it("creates the user with a null email rather than throwing", async () => {
    db.user.create.mockResolvedValue({
      id: "u-phoneonly",
      clerkId: "clerk_phoneonly",
      email: null,
      name: "Mona Saleh",
      role: "USER",
      memberships: [],
    });

    const result = await checkUser();

    expect(result?.email).toBeNull();
    // Explicitly null, not undefined — the column has no default, so relying on
    // Prisma's omit-means-skip would be leaning on a behaviour we don't want.
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clerkId: "clerk_phoneonly", email: null }),
      }),
    );
  });

  it("skips the pending-organization lookup when there is no email", async () => {
    db.user.create.mockResolvedValue({
      id: "u-phoneonly",
      clerkId: "clerk_phoneonly",
      email: null,
      name: "Mona Saleh",
      role: "USER",
      memberships: [],
    });

    await checkUser();

    // Matching organizations on a null pendingOwnerEmail would claim every
    // organization still awaiting an owner.
    expect(db.organization.findMany).not.toHaveBeenCalled();
  });
});
