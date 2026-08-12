import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const count = vi.fn();

vi.mock("@/lib/prisma", () => ({
  db: { testDrive: { findMany: (...args: unknown[]) => findMany(...args), count: (...args: unknown[]) => count(...args) } },
}));

// The serializer is exercised by its own tests; here it only has to not throw.
vi.mock("@/lib/utils/serializers", () => ({
  serializeTestDrive: (t: unknown) => t,
}));

import { findManyTestDrives } from "@/lib/repositories/test-drive/queries";

/** The `where` that findManyTestDrives handed to Prisma. */
async function whereFor(filters: Record<string, unknown>) {
  await findManyTestDrives(filters, {});
  return findMany.mock.calls[0][0].where;
}

beforeEach(() => {
  findMany.mockReset().mockResolvedValue([]);
  count.mockReset().mockResolvedValue(0);
});

describe("findManyTestDrives search filter", () => {
  it("matches the car and the customer", async () => {
    const where = await whereFor({ search: "corolla" });

    expect(where.OR).toEqual([
      { car: { title: { contains: "corolla", mode: "insensitive" } } },
      { car: { make: { contains: "corolla", mode: "insensitive" } } },
      { car: { model: { contains: "corolla", mode: "insensitive" } } },
      { user: { name: { contains: "corolla", mode: "insensitive" } } },
      { user: { email: { contains: "corolla", mode: "insensitive" } } },
    ]);
  });

  it("keeps the organization scope alongside the search", async () => {
    const where = await whereFor({ organizationId: "org-1", search: "corolla" });

    // The scope must stay a top-level AND term. If it were folded into OR,
    // a search would return other tenants' test drives.
    expect(where.organizationId).toBe("org-1");
    expect(where.OR).toHaveLength(5);
  });

  it("keeps the per-user scope alongside the search", async () => {
    const where = await whereFor({ userId: "user-1", search: "corolla" });

    expect(where.userId).toBe("user-1");
    expect(where.OR).toHaveLength(5);
  });

  it("ignores an absent or whitespace-only term", async () => {
    expect(await whereFor({ organizationId: "org-1" })).not.toHaveProperty("OR");

    findMany.mockClear();
    expect(await whereFor({ organizationId: "org-1", search: "   " })).not.toHaveProperty("OR");
  });

  it("trims the term before matching", async () => {
    const where = await whereFor({ search: "  corolla  " });

    expect(where.OR[0]).toEqual({
      car: { title: { contains: "corolla", mode: "insensitive" } },
    });
  });
});
