import { describe, it, expect, vi, beforeEach } from "vitest";

const { enforceListingQuestionLimit, askAboutListing, getCurrentOrganization } = vi.hoisted(() => ({
  enforceListingQuestionLimit: vi.fn(),
  askAboutListing: vi.fn(),
  getCurrentOrganization: vi.fn(),
}));

vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceListingQuestionLimit }));
vi.mock("@/lib/services/car/listing-assistant", () => ({ askAboutListing }));
vi.mock("@/lib/getOrganization", () => ({ getCurrentOrganization }));

import { askListingAssistant } from "@/actions/listing-assistant";
import { RateLimitError } from "@/lib/utils/errors";

const CAR_ID = "3f1c2a52-6f0e-4d9b-9a3e-2f6a8f0c1d11";

beforeEach(() => {
  vi.resetAllMocks();
  getCurrentOrganization.mockResolvedValue(null);
  askAboutListing.mockResolvedValue({ status: "answered", answer: "White." });
});

describe("askListingAssistant", () => {
  it("rate-limits on the validated car id, then asks", async () => {
    const response = await askListingAssistant({ carId: CAR_ID, question: "  Colour? ", locale: "en" });
    expect(response).toMatchObject({ success: true, data: { status: "answered" } });
    expect(enforceListingQuestionLimit).toHaveBeenCalledWith(CAR_ID);
    expect(askAboutListing).toHaveBeenCalledWith(CAR_ID, "Colour?", "en", null);
  });

  it("never lets a malformed id reach the rate limiter as a key", async () => {
    const response = await askListingAssistant({ carId: "../anything", question: "Colour?", locale: "en" });
    expect(response).toMatchObject({ success: false });
    expect(enforceListingQuestionLimit).not.toHaveBeenCalled();
    expect(askAboutListing).not.toHaveBeenCalled();
  });

  it("refuses an over-long question before it costs anything", async () => {
    const response = await askListingAssistant({ carId: CAR_ID, question: "x".repeat(301), locale: "en" });
    expect(response).toMatchObject({ success: false });
    expect(askAboutListing).not.toHaveBeenCalled();
  });

  it("stops at the rate limit", async () => {
    enforceListingQuestionLimit.mockRejectedValue(new RateLimitError("Too many questions."));
    const response = await askListingAssistant({ carId: CAR_ID, question: "Colour?", locale: "en" });
    expect(response).toMatchObject({ success: false });
    expect(askAboutListing).not.toHaveBeenCalled();
  });

  it("scopes to the dealership subdomain from middleware", async () => {
    getCurrentOrganization.mockResolvedValue({ id: "org-sub" });
    await askListingAssistant({ carId: CAR_ID, question: "Colour?", locale: "ar" });
    expect(askAboutListing).toHaveBeenCalledWith(CAR_ID, "Colour?", "ar", "org-sub");
  });
});
