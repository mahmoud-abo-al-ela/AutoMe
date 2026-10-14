import { describe, it, expect } from "vitest";
import { mobileTabs } from "./mobile-tabs";

const at = (viewer: Parameters<typeof mobileTabs>[0], onSubdomain = false) =>
  mobileTabs(viewer, { onSubdomain, dashboardHref: "/org/red-sea-motors/dashboard" }).map((tab) => `${tab.labelKey} ${tab.href}`);

describe("the phone tab bar, for each viewer", () => {
  it("lets a guest browse — no Saved or Messages, which would only ask them to sign in", () => {
    expect(at("guest")).toEqual(["home /", "cars /cars", "dealerships /dealerships", "compare /compare"]);
  });

  it("leaves the dealership directory off a dealership's own storefront", () => {
    expect(at("guest", true)).toEqual(["home /", "cars /cars", "compare /compare"]);
  });

  it("gives a buyer their saved cars and conversations, with the unread count on Messages", () => {
    expect(at("buyer")).toEqual(["home /", "cars /cars", "saved /wishlist", "messages /messages"]);
    expect(mobileTabs("buyer", { onSubdomain: false, dashboardHref: "/x" }).find((tab) => tab.unread)?.href).toBe("/messages");
  });

  it("gives a dealer their dashboard", () => {
    expect(at("dealer")).toEqual(["home /", "cars /cars", "dashboard /org/red-sea-motors/dashboard"]);
  });

  it("calls the car list Cars, not Search, for everyone", () => {
    for (const viewer of ["guest", "buyer", "dealer"] as const) {
      expect(at(viewer)).toContain("cars /cars");
    }
  });
});
