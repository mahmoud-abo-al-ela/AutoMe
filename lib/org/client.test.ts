import { describe, it, expect } from "vitest";
import { getOrgSlugFromPath, isSuperAdminPath, showsDealerPitch } from "@/lib/org/client";

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
