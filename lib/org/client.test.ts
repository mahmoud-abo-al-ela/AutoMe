import { describe, it, expect } from "vitest";
import { getOrgSlugFromPath, isDashboardPath, showsDealerPitch } from "@/lib/org/client";

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

describe("isDashboardPath", () => {
  it.each(["/ar/org/mo-motors/dashboard", "/en/super-admin", "/en/super-admin/users/1", "/org/mo-motors"])(
    "is true for a dashboard (%s)",
    (path) => {
      expect(isDashboardPath(path)).toBe(true);
    }
  );

  it.each(["/en", "/ar/cars/123", "/en/organizations", "/en/dealerships/org-motors", "/sign-in"])(
    "is false for a public page (%s)",
    (path) => {
      expect(isDashboardPath(path)).toBe(false);
    }
  );
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
