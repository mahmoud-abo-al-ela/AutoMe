import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidElement, type ReactElement } from "react";

// The page's decision is under test, not its markup: everything it renders is
// stubbed, and notFound throws like the real one does.
const getCarById = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  })
);

vi.mock("@/actions/cars-listing", () => ({ getCarById }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en", getTranslations: async () => (key: string) => key }));
vi.mock("./", () => ({}));
vi.mock("./CarSpecifications", () => ({ default: () => null }));
vi.mock("./CarWebMcpTools", () => ({ default: () => null }));
vi.mock("@/components/StreamChat", () => ({ OpenChatFromLink: () => null }));
vi.mock("@/components/BuyerAccess", () => ({ BuyerTargetProvider: () => null }));
vi.mock("../_lib/webmcp-summary", () => ({ carToolSummary: () => null }));
vi.mock("@/lib/services/car/listing-assistant", () => ({ isListingAssistantOffered: async () => false }));
vi.mock("@/lib/services/car/market-price", () => ({ marketPricesFor: async () => null, toMarketPosition: () => null }));
vi.mock("@/lib/services/mcp/referrals", () => ({ recordMcpReferral: vi.fn() }));
vi.mock("@/lib/utils/errors", () => ({ logError: vi.fn() }));

import CarContent from "./CarContent";

const failure = (code: string, message = "x") => ({ success: false, error: { code, message } });

beforeEach(() => vi.clearAllMocks());

describe("the car page", () => {
  it("is the not-found page for a car that does not exist, or is hidden — not an error", async () => {
    getCarById.mockResolvedValue(failure("NOT_FOUND", "Car not found"));

    await expect(CarContent({ id: "missing" })).rejects.toThrow("NOT_FOUND");
  });

  it("still says so when the car could not be loaded for another reason", async () => {
    getCarById.mockResolvedValue(failure("UNEXPECTED_ERROR", "connection refused"));

    const page = (await CarContent({ id: "car-1" })) as ReactElement;
    expect(notFound).not.toHaveBeenCalled();
    expect(isValidElement(page)).toBe(true);
    expect(JSON.stringify(page.props)).toContain("fetchError");
  });
});
