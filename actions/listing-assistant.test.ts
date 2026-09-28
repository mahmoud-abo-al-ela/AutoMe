import { describe, it, expect, vi, beforeEach } from "vitest";

const { enforceListingQuestionLimit, askAboutListing, getCurrentOrganization, rateListingAnswer } = vi.hoisted(() => ({
  rateListingAnswer: vi.fn(),
  enforceListingQuestionLimit: vi.fn(),
  askAboutListing: vi.fn(),
  getCurrentOrganization: vi.fn(),
}));

vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceListingQuestionLimit }));
vi.mock("@/lib/services/car/listing-assistant", () => ({ askAboutListing, rateListingAnswer }));
vi.mock("@/lib/getOrganization", () => ({ getCurrentOrganization }));

import { askListingAssistant, rateListingAssistantAnswer } from "@/actions/listing-assistant";
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
    expect(askAboutListing).toHaveBeenCalledWith(CAR_ID, "Colour?", "en", null, expect.anything());
  });

  it.each([
    ["greeting", "السلام عليكم"],
    ["thanks", "شكراً!"],
    ["noise", "test"],
    ["noise", "؟؟؟"],
  ])("answers %s instantly, with no rate limit and no model", async (kind, question) => {
    const response = await askListingAssistant({ carId: CAR_ID, question, locale: "ar" });
    expect(response).toMatchObject({ success: true, data: { status: "smallTalk", kind } });
    expect(enforceListingQuestionLimit).not.toHaveBeenCalled();
    expect(askAboutListing).not.toHaveBeenCalled();
  });

  it("passes the conversation so far to the service, bounded", async () => {
    const history = [{ question: "Colour?", answer: "White." }];
    await askListingAssistant({ carId: CAR_ID, question: "and the price?", locale: "en", history });
    expect(askAboutListing.mock.calls[0][4]).toMatchObject({ history });

    const tooLong = Array.from({ length: 5 }, () => ({ question: "q", answer: "a" }));
    const response = await askListingAssistant({ carId: CAR_ID, question: "and?", locale: "en", history: tooLong });
    expect(response).toMatchObject({ success: false });
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
    expect(askAboutListing).toHaveBeenCalledWith(CAR_ID, "Colour?", "ar", "org-sub", expect.anything());
  });
});

describe("rateListingAssistantAnswer", () => {
  const ANSWER_ID = "8d3b1c0e-2f4a-4c1d-9b7e-5a6f7e8d9c01";

  it("rates a real answer id, without spending the buyer's question budget", async () => {
    const response = await rateListingAssistantAnswer({ answerId: ANSWER_ID, helpful: false });
    expect(response).toMatchObject({ success: true });
    expect(rateListingAnswer).toHaveBeenCalledWith(ANSWER_ID, false);
    expect(enforceListingQuestionLimit).not.toHaveBeenCalled();
  });

  it("refuses anything that is not an answer id and a yes or no", async () => {
    for (const input of [{ answerId: "../x", helpful: true }, { answerId: ANSWER_ID, helpful: "no" }, {}]) {
      expect(await rateListingAssistantAnswer(input)).toMatchObject({ success: false });
    }
    expect(rateListingAnswer).not.toHaveBeenCalled();
  });
});
