import { describe, it, expect } from "vitest";
import { asEnumParam } from "@/lib/utils/enum-params";

// Shaped like Prisma's generated enum objects.
const PlanType = {
  STARTER: "STARTER",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;

describe("asEnumParam", () => {
  it("passes through a real member", () => {
    expect(asEnumParam(PlanType, "PRO")).toBe("PRO");
  });

  it("drops a value that is not a member", () => {
    // The reason this helper exists: handing "gold" to a Prisma enum filter
    // throws PrismaClientValidationError and 500s the page.
    expect(asEnumParam(PlanType, "gold")).toBeUndefined();
  });

  it("drops the 'all' sentinel the filter UIs use", () => {
    expect(asEnumParam(PlanType, "all")).toBeUndefined();
  });

  it("drops absent values", () => {
    expect(asEnumParam(PlanType, undefined)).toBeUndefined();
    expect(asEnumParam(PlanType, null)).toBeUndefined();
    expect(asEnumParam(PlanType, "")).toBeUndefined();
  });

  it("is case-sensitive, matching Prisma's enum values", () => {
    expect(asEnumParam(PlanType, "pro")).toBeUndefined();
  });
});
