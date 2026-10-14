import { describe, it, expect, vi, beforeEach } from "vitest";

const { auth, getSessionIdFromCookies, findSessionForAuthorization } = vi.hoisted(() => ({
  auth: vi.fn(),
  getSessionIdFromCookies: vi.fn(),
  findSessionForAuthorization: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("./cookie", () => ({ getSessionIdFromCookies }));
vi.mock("@/lib/repositories/impersonation", () => ({ findSessionForAuthorization }));

import {
  isImpersonatingOrganization,
  resolveActiveImpersonation,
  SESSION_LIFETIME_MS,
} from "@/lib/services/impersonation/active";

const ADMIN_CLERK = "clerk_admin";

/** A session row as the repository returns it: open, an hour old, run by the signed-in admin. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    startedAt: new Date(Date.now() - 60 * 60 * 1000),
    endedAt: null,
    targetUserId: "target-user",
    targetOrganizationId: "org-b",
    superAdmin: { id: "admin-1", clerkId: ADMIN_CLERK, role: "ADMIN", email: "a@x.eg", name: "Admin" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: ADMIN_CLERK });
  getSessionIdFromCookies.mockResolvedValue("session-1");
  findSessionForAuthorization.mockResolvedValue(row());
});

describe("resolveActiveImpersonation", () => {
  it("is null without the session cookie, and never reads the database", async () => {
    getSessionIdFromCookies.mockResolvedValue(undefined);

    expect(await resolveActiveImpersonation()).toBeNull();
    expect(findSessionForAuthorization).not.toHaveBeenCalled();
  });

  it("is null for a session id with no row — a forged cookie", async () => {
    findSessionForAuthorization.mockResolvedValue(null);
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("is null for a session that was ended", async () => {
    findSessionForAuthorization.mockResolvedValue(row({ endedAt: new Date() }));
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("is null for a session past its lifetime", async () => {
    findSessionForAuthorization.mockResolvedValue(
      row({ startedAt: new Date(Date.now() - SESSION_LIFETIME_MS - 60_000) }),
    );
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("is null when the session belongs to another admin than the one signed in", async () => {
    auth.mockResolvedValue({ userId: "clerk_someone_else" });
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("is null when the admin running it is no longer a platform admin", async () => {
    findSessionForAuthorization.mockResolvedValue(
      row({ superAdmin: { id: "admin-1", clerkId: ADMIN_CLERK, role: "USER", email: null, name: null } }),
    );
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("is null when nobody is signed in", async () => {
    auth.mockResolvedValue({ userId: null });
    expect(await resolveActiveImpersonation()).toBeNull();
  });

  it("returns the target user and dealership from the row", async () => {
    expect(await resolveActiveImpersonation()).toEqual({
      sessionId: "session-1",
      superAdmin: { id: "admin-1", email: "a@x.eg", name: "Admin" },
      targetUserId: "target-user",
      targetOrganizationId: "org-b",
    });
  });
});

describe("isImpersonatingOrganization", () => {
  it("holds only for the dealership the verified session targets", async () => {
    expect(await isImpersonatingOrganization("org-b")).toBe(true);
    expect(await isImpersonatingOrganization("org-c")).toBe(false);
  });

  it("never holds without a verified session", async () => {
    findSessionForAuthorization.mockResolvedValue(row({ endedAt: new Date() }));
    expect(await isImpersonatingOrganization("org-b")).toBe(false);
  });
});
