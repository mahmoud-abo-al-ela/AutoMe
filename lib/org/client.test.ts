import { describe, it, expect } from "vitest";
import {
  getOrgSlugFromPath,
  isSuperAdminPath,
  parsePlateBand,
  plateBandFor,
  plateBandForMemberRole,
  showsDealerPitch,
} from "@/lib/org/client";

describe("getOrgSlugFromPath", () => {
  it.each([
    ["/ar/org/mo-motors/cars/create/ai", "mo-motors"],
    ["/en/org/mo-motors/dashboard", "mo-motors"],
    ["/org/mo-motors/cars", "mo-motors"],
  ])("reads the slug from %s", (path, slug) => {
    expect(getOrgSlugFromPath(path)).toBe(slug);
  });

  it("does not take the word 'org' for the slug", () => {
    // The bug: splitting "/ar/org/mo-motors" by position gave "org".
    expect(getOrgSlugFromPath("/ar/org/mo-motors")).not.toBe("org");
  });

  it.each(["/ar/cars", "/", "/ar/org"])("is null outside a dashboard (%s)", (path) => {
    expect(getOrgSlugFromPath(path)).toBeNull();
  });
});

describe("showsDealerPitch", () => {
  const member = { role: "USER", memberships: [{ role: "MEMBER" }] };

  it("pitches to signed-out visitors and buyers on the marketplace", () => {
    expect(showsDealerPitch(null, false)).toBe(true);
    expect(showsDealerPitch({ role: "USER", memberships: [] }, false)).toBe(true);
    expect(showsDealerPitch({ role: "USER" }, false)).toBe(true);
  });

  it("does not pitch to anyone already in a dealership, or a platform admin", () => {
    expect(showsDealerPitch(member, false)).toBe(false);
    expect(showsDealerPitch({ role: "ADMIN", memberships: [] }, false)).toBe(false);
  });

  it("never pitches on a dealership's own storefront", () => {
    expect(showsDealerPitch(null, true)).toBe(false);
  });
});

describe("isSuperAdminPath", () => {
  it.each(["/super-admin", "/en/super-admin/plans", "/ar/super-admin"])("%s is the super-admin", (path) => {
    expect(isSuperAdminPath(path)).toBe(true);
  });

  it.each(["/en/org/x/dashboard", "/org/x", "/en", "/ar/cars"])("%s is not", (path) => {
    expect(isSuperAdminPath(path)).toBe(false);
  });
});

describe("plateBandFor", () => {
  const member = (role: string, slug: string) => ({ role, organization: { slug } });
  const owner = { role: "USER", memberships: [member("OWNER", "mo-motors")] };
  const team = { role: "USER", memberships: [member("MEMBER", "mo-motors")] };

  it("is the plain EGYPT plate for a visitor or a buyer", () => {
    expect(plateBandFor(null)).toBe("buyer");
    expect(plateBandFor({ role: "USER", memberships: [] })).toBe("buyer");
  });

  it("is ADMIN for platform staff, impersonating included", () => {
    expect(plateBandFor({ role: "ADMIN" })).toBe("admin");
    // While impersonating, the session user is the dealer.
    expect(plateBandFor({ ...owner, isImpersonated: true }, "mo-motors")).toBe("admin");
  });

  it("is the dealership role on the marketplace", () => {
    expect(plateBandFor(owner)).toBe("owner");
    expect(plateBandFor(team)).toBe("team");
  });

  it("prefers OWNER when the user holds both roles somewhere", () => {
    expect(
      plateBandFor({ role: "USER", memberships: [member("MEMBER", "a"), member("OWNER", "b")] })
    ).toBe("owner");
  });

  it("is their role in this storefront's dealership, and a buyer's in another's", () => {
    expect(plateBandFor(owner, "mo-motors")).toBe("owner");
    expect(plateBandFor(team, "mo-motors")).toBe("team");
    expect(plateBandFor(owner, "nile-cars")).toBe("buyer");
  });
});

describe("parsePlateBand", () => {
  it.each(["buyer", "owner", "team", "admin"])("keeps a known band (%s)", (band) => {
    expect(parsePlateBand(band)).toBe(band);
  });

  it.each([undefined, null, "", "ADMIN", "<script>"])("falls back to the plain plate for %s", (value) => {
    expect(parsePlateBand(value)).toBe("buyer");
  });
});

describe("plateBandForMemberRole", () => {
  it("maps the dashboard role, and no role to admin", () => {
    expect(plateBandForMemberRole("OWNER")).toBe("owner");
    expect(plateBandForMemberRole("MEMBER")).toBe("team");
    expect(plateBandForMemberRole(undefined)).toBe("admin");
  });
});
