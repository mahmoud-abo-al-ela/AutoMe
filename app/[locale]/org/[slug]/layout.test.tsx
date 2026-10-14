import { describe, it, expect, vi, beforeEach } from "vitest";

// The layout's own decisions are under test, not its markup: everything it
// renders is stubbed, and redirect / notFound throw like the real ones do.
const checkUser = vi.hoisted(() => vi.fn());
const getOrganizationBySlug = vi.hoisted(() => vi.fn());
const getUserMembership = vi.hoisted(() => vi.fn());
const resolveActiveImpersonation = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((args: { href: string }) => {
    throw new Error(`REDIRECT ${args.href}`);
  })
);
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  })
);

vi.mock("@/lib/checkUser", () => ({ checkUser }));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationBySlug, getUserMembership }));
vi.mock("@/lib/services/impersonation/active", () => ({ resolveActiveImpersonation }));
vi.mock("@/lib/services/impersonation/impersonation", () => ({ getCurrentImpersonationSession: vi.fn(async () => null) }));
vi.mock("@/i18n/navigation", () => ({ redirect }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en", getTranslations: async () => (key: string) => key }));
vi.mock("@/components/BackToTop", () => ({ default: () => null }));
vi.mock("@/components/brand", () => ({ RoadLoader: () => null }));
vi.mock("@/components/brand/site-font", () => ({ alexandria: { variable: "font" } }));
vi.mock("@/components/brand/SiteToaster", () => ({ SiteToaster: () => null }));
vi.mock("@/lib/org/client", () => ({ plateBandForMemberRole: () => "owner" }));
vi.mock("./_components/OrgTopBar", () => ({ OrgTopBar: () => null }));
vi.mock("./_components/ImpersonationBanner", () => ({ default: () => null }));

import OrganizationLayout from "./layout";

const render = () =>
  OrganizationLayout({ children: null, params: Promise.resolve({ locale: "en", slug: "red-sea-motors" }) });

beforeEach(() => {
  vi.clearAllMocks();
  getOrganizationBySlug.mockResolvedValue({ id: "org-red-sea", slug: "red-sea-motors", name: "Red Sea Motors" });
  getUserMembership.mockResolvedValue(null);
  resolveActiveImpersonation.mockResolvedValue(null);
});

describe("the dealer dashboard layout", () => {
  it("sends a platform admin with no session to the super-admin area — not a 404 (e.g. just after ending a session)", async () => {
    checkUser.mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    await expect(render()).rejects.toThrow("REDIRECT /super-admin");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("is not found for anyone else without access", async () => {
    checkUser.mockResolvedValue({ id: "user-1", role: "USER" });

    await expect(render()).rejects.toThrow("NOT_FOUND");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("opens for a member, and for an admin in a session for this dealership", async () => {
    checkUser.mockResolvedValue({ id: "user-1", role: "USER" });
    getUserMembership.mockResolvedValue({ role: "OWNER" });
    await expect(render()).resolves.toBeTruthy();

    checkUser.mockResolvedValue({ id: "owner-of-red-sea", role: "USER" });
    getUserMembership.mockResolvedValue(null);
    resolveActiveImpersonation.mockResolvedValue({ targetOrganizationId: "org-red-sea" });
    await expect(render()).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("does not let a session for another dealership open this one", async () => {
    checkUser.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    resolveActiveImpersonation.mockResolvedValue({ targetOrganizationId: "org-elsewhere" });

    await expect(render()).rejects.toThrow("REDIRECT /super-admin");
  });
});
