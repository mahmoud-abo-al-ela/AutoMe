import { describe, it, expect, vi, beforeEach } from "vitest";

const catalog = vi.hoisted(() => ({ searchPublicCars: vi.fn(), getPublicCar: vi.fn() }));
const guard = vi.hoisted(() => ({ assertNotSweeping: vi.fn(), noteMiss: vi.fn() }));
const limits = vi.hoisted(() => ({ enforceMcpCostlyLimit: vi.fn() }));
vi.mock("@/lib/services/public-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/public-catalog")>()),
  ...catalog,
}));
vi.mock("@/lib/services/mcp/sweep-guard", () => guard);
vi.mock("@/lib/middleware/with-rate-limit", () => limits);
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall: vi.fn() }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/client";
import { createPublicMcpServer } from "../server";
import { NotFoundError, RateLimitError } from "@/lib/utils/errors";

const CALLER = { ip: "203.0.113.7", userAgent: "vitest" };
const ID = "3f6c1d2e-8a4b-4c5d-9e6f-7a8b9c0d1e2f";

async function connect() {
  const server = createPublicMcpServer(CALLER);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "vitest", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

const SUMMARY = {
  id: ID, title: "2020 Toyota Corolla", make: "Toyota", model: "Corolla", year: 2020,
  price: { amount: 850000, currency: "EGP" }, mileageKm: 1, bodyType: "Sedan", fuelType: "Gasoline",
  transmission: "Automatic", color: "White", status: "AVAILABLE", place: null,
  dealership: { name: "Nile Motors", slug: "nile-motors" }, url: "https://auto-me.example/en/cars/x", thumbnail: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  catalog.searchPublicCars.mockResolvedValue({ cars: [SUMMARY], total: 1, page: 1, hasMore: false });
});

describe("search_cars", () => {
  it("searches with the caller's filters and the defaults, and answers the catalog's results", async () => {
    const result = await (await connect()).callTool({
      name: "search_cars",
      arguments: { query: "كورولا", bodyType: ["Sedan"], maxPrice: 900000, locale: "ar" },
    });
    expect(result.structuredContent).toMatchObject({ total: 1, cars: [{ id: ID }] });
    expect(catalog.searchPublicCars).toHaveBeenCalledWith(
      { query: "كورولا", bodyType: ["Sedan"], maxPrice: 900000, sort: "best", page: 1, limit: 10 },
      "ar",
      { source: "mcp", medium: "search_cars" }
    );
  });

  it("spends the costly-call limit on words and on deep pages, not on a plain filter", async () => {
    const client = await connect();
    await client.callTool({ name: "search_cars", arguments: { bodyType: ["SUV"] } });
    expect(limits.enforceMcpCostlyLimit).not.toHaveBeenCalled();
    await client.callTool({ name: "search_cars", arguments: { query: "sunroof" } });
    await client.callTool({ name: "search_cars", arguments: { page: 6 } });
    expect(limits.enforceMcpCostlyLimit).toHaveBeenCalledTimes(2);
  });

  it("refuses input outside the contract before searching", async () => {
    const client = await connect();
    for (const args of [
      { limit: 21 },
      { page: 21 },
      { sort: "price; DROP TABLE" },
      { bodyType: ["Tank"] },
      { query: "x".repeat(201) },
      { make: Array.from({ length: 11 }, () => "Kia") },
      { maxPrice: -1 },
    ]) {
      expect((await client.callTool({ name: "search_cars", arguments: args })).isError, JSON.stringify(args)).toBe(true);
    }
    expect(catalog.searchPublicCars).not.toHaveBeenCalled();
  });
});

describe("get_car", () => {
  it("answers not_found for a hidden or missing car, and counts the miss", async () => {
    catalog.getPublicCar.mockRejectedValue(new NotFoundError("Car"));
    const result = await (await connect()).callTool({ name: "get_car", arguments: { id: ID } });
    expect(result).toMatchObject({ isError: true, structuredContent: { error: "not_found" } });
    expect(guard.noteMiss).toHaveBeenCalledWith(CALLER.ip);
  });

  it("refuses a caller sweeping ids before looking the car up", async () => {
    guard.assertNotSweeping.mockRejectedValueOnce(new RateLimitError("sweeping", {}, 600));
    const result = await (await connect()).callTool({ name: "get_car", arguments: { id: ID } });
    expect(result).toMatchObject({ isError: true, structuredContent: { error: "rate_limited" } });
    expect(catalog.getPublicCar).not.toHaveBeenCalled();
  });

  it("refuses an id that is not a car id at all", async () => {
    const result = await (await connect()).callTool({ name: "get_car", arguments: { id: "../../etc/passwd" } });
    expect(result.isError).toBe(true);
    expect(catalog.getPublicCar).not.toHaveBeenCalled();
  });
});
