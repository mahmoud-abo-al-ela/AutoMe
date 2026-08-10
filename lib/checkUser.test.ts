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

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";

// vi.mock replaces these with mock functions; the imported types still describe
// the real implementations, so re-view them as mocks to configure per test.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);
const mockHeaders = vi.mocked(headers as unknown as () => Promise<Headers>);

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
