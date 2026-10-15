import { describe, it, expect } from "vitest";
import { buildCarWhereClause } from "./filters";

describe("buildCarWhereClause place filters", () => {
  it("matches a governorate on the dealership's region", () => {
    const where = buildCarWhereClause({ region: "CAI" });
    expect(where.organization.is).toMatchObject({ region: "CAI" });
    expect(where.organization.is.city).toBeUndefined();
  });

  it("ignores place filters inside one dealership's own scope", () => {
    const where = buildCarWhereClause({ organizationId: "org-1", region: "CAI", city: "new-cairo" }, { scope: "dealer" });
    expect(where.organization).toBeUndefined();
  });
});
