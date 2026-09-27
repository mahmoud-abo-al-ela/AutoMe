import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  findCarForAssistant,
  findActiveSubscription,
  countOrgAiCallsThisMonth,
  answerListingQuestion,
  findAnswersForCar,
  recordDeclinedQuestion,
  findOtherAvailableCars,
  findComparablePrices,
} = vi.hoisted(() => ({
  findCarForAssistant: vi.fn(),
  findActiveSubscription: vi.fn(),
  countOrgAiCallsThisMonth: vi.fn(),
  answerListingQuestion: vi.fn(),
  findAnswersForCar: vi.fn(),
  recordDeclinedQuestion: vi.fn(),
  findOtherAvailableCars: vi.fn(),
  findComparablePrices: vi.fn(),
}));

vi.mock("@/lib/repositories/car", () => ({
  findCarForAssistant,
  findOtherAvailableCars,
  findComparablePrices,
}));
vi.mock("@/lib/repositories/billing", () => ({ findActiveSubscription }));
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCallsThisMonth }));
vi.mock("@/lib/services/ai/answerListingQuestion", () => ({ answerListingQuestion }));
vi.mock("@/lib/repositories/buyer-question", () => ({ findAnswersForCar, recordDeclinedQuestion }));

import { askAboutListing, isListingAssistantOffered } from "@/lib/services/car/listing-assistant";
import { NotFoundError } from "@/lib/utils/errors";

const car = {
  id: "car-1",
  organizationId: "org-dealer",
  make: "Toyota",
  model: "Corolla",
  year: 2019,
  bodyType: "Sedan",
  color: "White",
  seats: 5,
  fuelType: "Petrol",
  transmission: "Automatic",
  mileage: 62000,
  price: { toString: () => "850000" },
  priceCurrency: "EGP",
  status: "AVAILABLE",
  title: null,
  titleEn: null,
  titleAr: null,
  description: null,
  descriptionEn: null,
  descriptionAr: null,
  features: [],
  featuresAr: [],
  images: ["https://img/1.jpg", "https://img/2.jpg"],
  imageAlts: null,
  createdAt: new Date("2026-09-01T10:00:00Z"),
  organization: {
    name: "Nile Motors",
    description: null,
    website: null,
    averageRating: 0,
    totalReviews: 0,
    city: null,
    region: "CAI",
    address: null,
    phone: null,
    workingHours: [],
  },
};

function plan(aiAssistant: unknown, monthlyPrice = 4900) {
  return { plan: { monthlyPrice, features: { aiAssistant } } };
}

beforeEach(() => {
  vi.resetAllMocks();
  findAnswersForCar.mockResolvedValue([]);
  findOtherAvailableCars.mockResolvedValue([]);
  findComparablePrices.mockResolvedValue([]);
  findCarForAssistant.mockResolvedValue(car);
  findActiveSubscription.mockResolvedValue(plan({ enabled: true, limit: 300 }));
  countOrgAiCallsThisMonth.mockResolvedValue(0);
  answerListingQuestion.mockResolvedValue({ grounded: true, answer: "White.", fieldsUsed: ["color"] });
});

describe("askAboutListing", () => {
  it("answers, billed to the dealer who owns the car — not the buyer", async () => {
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({
      status: "answered",
      answer: "White.",
    });
    const [, facts, language, ctx] = answerListingQuestion.mock.calls[0];
    expect(ctx).toEqual({ organizationId: "org-dealer", userId: null, priority: "standard" });
    expect(language).toBe("en");
    // Stored codes become place names, and the Decimal a number.
    expect(facts.dealership.place).toBe("Cairo");
    expect(facts.price).toEqual({ amount: 850000, currency: "EGP" });
  });

  it("names the place in the reader's language", async () => {
    await askAboutListing("car-1", "وين؟", "ar", null);
    expect(answerListingQuestion.mock.calls[0][1].dealership.place).toBe("القاهرة");
  });

  it("shows a decline as such, without model text", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false });
    expect(await askAboutListing("car-1", "Accidents?", "en", null)).toEqual({
      status: "notInListing",
    });
  });

  it("puts a declined question in the dealer's inbox, keyed for repeats", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false });
    await askAboutListing("car-1", "  Any ACCIDENTS? ", "en", null);
    expect(recordDeclinedQuestion).toHaveBeenCalledWith({
      organizationId: "org-dealer",
      carId: "car-1",
      question: "  Any ACCIDENTS? ",
      questionKey: "any accidents",
      locale: "en",
    });
  });

  it("still tells the buyer to ask the dealer if recording fails", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false });
    recordDeclinedQuestion.mockRejectedValue(new Error("db down"));
    expect(await askAboutListing("car-1", "Accidents?", "en", null)).toEqual({
      status: "notInListing",
    });
  });

  it("does not record a question the listing answered", async () => {
    await askAboutListing("car-1", "Colour?", "en", null);
    expect(recordDeclinedQuestion).not.toHaveBeenCalled();
  });

  it("hands the model the dealer's answers for this car", async () => {
    findAnswersForCar.mockResolvedValue([
      { question: "Instalments?", answer: "Yes.", appliesToAllCars: true },
    ]);
    await askAboutListing("car-1", "Can I pay monthly?", "en", null);
    expect(findAnswersForCar).toHaveBeenCalledWith("car-1", "org-dealer");
    expect(answerListingQuestion.mock.calls[0][1].dealerAnswers).toEqual([
      { question: "Instalments?", answer: "Yes.", about: "allCars" },
    ]);
  });

  it("answers from the listing alone if the dealer's answers cannot be read", async () => {
    findAnswersForCar.mockRejectedValue(new Error('relation "BuyerQuestion" does not exist'));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({
      status: "answered",
      answer: "White.",
    });
    expect(answerListingQuestion.mock.calls[0][1]).not.toHaveProperty("dealerAnswers");
  });

  it("hands the model only the history and terms the dealer stated", async () => {
    findCarForAssistant.mockResolvedValue({
      ...car,
      accidentFree: true,
      originalPaint: null,
      licenseValidUntil: new Date(Date.UTC(2027, 2, 1)),
      organization: { ...car.organization, offersFinancing: false, acceptsTradeIn: null, financingNote: "ignored" },
    });
    await askAboutListing("car-1", "Accidents?", "en", null);
    const facts = answerListingQuestion.mock.calls[0][1];
    expect(facts.history).toEqual({ accidentFree: true, licenseValidUntil: "2027-03" });
    // No financing means the note is meaningless, so it is not sent.
    expect(facts.dealershipTerms).toEqual({ offersFinancing: false });
  });

  it("describes the photos in the reader's language, falling back to the other", async () => {
    findCarForAssistant.mockResolvedValue({
      ...car,
      imageAlts: {
        "https://img/2.jpg": { en: "Leather seats", ar: "" },
        "https://img/1.jpg": { en: "Front view", ar: "منظر أمامي" },
      },
    });
    await askAboutListing("car-1", "جلد؟", "ar", null);
    // Display order, not the order the map happens to hold.
    expect(answerListingQuestion.mock.calls[0][1].photos).toEqual(["منظر أمامي", "Leather seats"]);
  });

  it("offers the dealership's cars nearest in price, and prices from comparable listings", async () => {
    findOtherAvailableCars.mockResolvedValue([
      { year: 2021, make: "Kia", model: "K5", color: "Red", price: { toString: () => "2000000" }, mileage: 1, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" },
      { year: 2019, make: "Toyota", model: "Corolla", color: "Black", price: "870000", mileage: 1, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" },
    ]);
    findComparablePrices.mockResolvedValue([800000, 850000, 900000]);
    await askAboutListing("car-1", "Cheaper?", "en", null);

    expect(findOtherAvailableCars).toHaveBeenCalledWith("org-dealer", "car-1");
    expect(findComparablePrices).toHaveBeenCalledWith({
      make: "Toyota", model: "Corolla", year: 2019, excludeCarId: "car-1", currency: "EGP",
    });
    const facts = answerListingQuestion.mock.calls[0][1];
    expect(facts.otherCars.map((c: { model: string }) => c.model)).toEqual(["Corolla", "K5"]);
    expect(facts.marketPrices).toMatchObject({ listings: 3, median: 850000, thisCarVsMedianPercent: 0 });
    expect(facts.listedOn).toBe("2026-09-01");
  });

  it("answers without alternatives or prices when those reads fail", async () => {
    findOtherAvailableCars.mockRejectedValue(new Error("db"));
    findComparablePrices.mockRejectedValue(new Error("db"));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "answered", answer: "White." });
    const facts = answerListingQuestion.mock.calls[0][1];
    expect(facts).not.toHaveProperty("otherCars");
    expect(facts).not.toHaveProperty("marketPrices");
  });

  it("does not spend when the plan does not offer it", async () => {
    findActiveSubscription.mockResolvedValue(plan(undefined));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "unavailable" });
    expect(answerListingQuestion).not.toHaveBeenCalled();
  });

  it("does not spend once this month's answers are used up", async () => {
    findActiveSubscription.mockResolvedValue(plan({ enabled: true, limit: 20 }));
    countOrgAiCallsThisMonth.mockResolvedValue(20);
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "unavailable" });
    expect(answerListingQuestion).not.toHaveBeenCalled();
    expect(countOrgAiCallsThisMonth).toHaveBeenCalledWith("org-dealer", ["listingQA"]);
  });

  it("treats a missing limit as none, like withUsageLimit", async () => {
    findActiveSubscription.mockResolvedValue(plan({ enabled: true }));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "unavailable" });
  });

  it("does not count usage on an unlimited plan", async () => {
    findActiveSubscription.mockResolvedValue(plan({ enabled: true, limit: -1 }));
    await askAboutListing("car-1", "Colour?", "en", null);
    expect(countOrgAiCallsThisMonth).not.toHaveBeenCalled();
  });

  it("runs a free-plan dealer's buyers at low priority", async () => {
    findActiveSubscription.mockResolvedValue(plan({ enabled: true, limit: 20 }, 0));
    await askAboutListing("car-1", "Colour?", "en", null);
    expect(answerListingQuestion.mock.calls[0][3].priority).toBe("low");
  });

  it("does not find another dealer's car from a dealership subdomain", async () => {
    await expect(askAboutListing("car-1", "Colour?", "en", "org-other")).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(answerListingQuestion).not.toHaveBeenCalled();
  });

  it("does not find a car that does not exist", async () => {
    findCarForAssistant.mockResolvedValue(null);
    await expect(askAboutListing("nope", "Colour?", "en", null)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("isListingAssistantOffered", () => {
  it("is offered with answers left, and not without a subscription", async () => {
    expect(await isListingAssistantOffered("org-dealer")).toBe(true);
    findActiveSubscription.mockResolvedValue(null);
    expect(await isListingAssistantOffered("org-dealer")).toBe(false);
  });
});
