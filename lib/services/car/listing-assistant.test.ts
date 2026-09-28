import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  findCarForAssistant,
  findActiveSubscription,
  countOrgAiCarsThisMonth,
  answerListingQuestion,
  findAnswersForCar,
  recordDeclinedQuestion,
  findOtherAvailableCars,
  findComparablePrices,
  recordAssistantAnswer,
  rateAssistantAnswer,
} = vi.hoisted(() => ({
  findCarForAssistant: vi.fn(),
  findActiveSubscription: vi.fn(),
  countOrgAiCarsThisMonth: vi.fn(),
  answerListingQuestion: vi.fn(),
  findAnswersForCar: vi.fn(),
  recordDeclinedQuestion: vi.fn(),
  findOtherAvailableCars: vi.fn(),
  findComparablePrices: vi.fn(),
  recordAssistantAnswer: vi.fn(),
  rateAssistantAnswer: vi.fn(),
}));

vi.mock("@/lib/repositories/car", () => ({
  findCarForAssistant,
  findOtherAvailableCars,
  findComparablePrices,
}));
vi.mock("@/lib/repositories/billing", () => ({ findActiveSubscription }));
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCarsThisMonth }));
vi.mock("@/lib/services/ai/answerListingQuestion", () => ({ answerListingQuestion }));
vi.mock("@/lib/repositories/buyer-question", () => ({ findAnswersForCar, recordDeclinedQuestion }));
vi.mock("@/lib/repositories/assistant-answer", () => ({ recordAssistantAnswer, rateAssistantAnswer }));

import { askAboutListing, isListingAssistantOffered, rateListingAnswer } from "@/lib/services/car/listing-assistant";
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
  countOrgAiCarsThisMonth.mockResolvedValue(0);
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

  it("shows a decline as such, with the checked wording when there is one", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false });
    expect(await askAboutListing("car-1", "Accidents?", "en", null)).toEqual({
      status: "notInListing",
    });
    answerListingQuestion.mockResolvedValue({ grounded: false, message: "The listing doesn't say." });
    expect(await askAboutListing("car-1", "Accidents?", "en", null)).toEqual({
      status: "notInListing",
      message: "The listing doesn't say.",
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

  it("does not file an off-topic message for the dealer", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false, offTopic: true, message: "Only this car, sorry." });
    expect(await askAboutListing("car-1", "Weather?", "en", null)).toEqual({
      status: "offTopic",
      message: "Only this car, sorry.",
    });
    expect(recordDeclinedQuestion).not.toHaveBeenCalled();
  });

  it("files a follow-up for the dealer as the question on its own", async () => {
    answerListingQuestion.mockResolvedValue({ grounded: false, standalone: "العربية دي بكام؟" });
    await askAboutListing("car-1", "وبكام؟", "ar", null, {
      history: [{ question: "لونها ايه؟", answer: "أبيض." }],
    });
    expect(recordDeclinedQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ question: "العربية دي بكام؟" })
    );
    // The conversation reached the model call.
    expect(answerListingQuestion.mock.calls[0][4]).toMatchObject({
      history: [{ question: "لونها ايه؟", answer: "أبيض." }],
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
      make: "Toyota", model: "Corolla", bodyType: undefined, year: 2019, yearSpan: 1,
      excludeCarId: "car-1", currency: "EGP",
    });
    // Found enough at the first level, so it looked no wider.
    expect(findComparablePrices).toHaveBeenCalledTimes(1);
    const facts = answerListingQuestion.mock.calls[0][1];
    expect(facts.otherCars.map((c: { model: string }) => c.model)).toEqual(["Corolla", "K5"]);
    expect(facts.marketPrices).toMatchObject({ listings: 3, median: 850000, thisCarVsMedianPercent: 0 });
    expect(facts.listedOn).toBe("2026-09-01");
  });

  it("turns the cars an answer names into cards, and its buttons into links from the dealer's row", async () => {
    findCarForAssistant.mockResolvedValue({
      ...car,
      organization: { ...car.organization, address: "12 Nile St, Cairo", phone: "0100 123-4567" },
    });
    findOtherAvailableCars.mockResolvedValue([
      { id: "car-k5", images: ["https://img/k5.jpg"], year: 2021, make: "Kia", model: "K5", color: "Red", price: "900000", mileage: 1, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" },
      { id: "car-el", images: [], year: 2019, make: "Hyundai", model: "Elantra", color: "Black", price: "860000", mileage: 1, bodyType: "Sedan", transmission: "Automatic", fuelType: "Petrol" },
    ]);
    // Refs are positions in the facts, which are sorted by price: Elantra is 1.
    answerListingQuestion.mockResolvedValue({
      grounded: true, answer: "They also have a K5.", fieldsUsed: ["otherCars"],
      actions: ["directions", "call"], carRefs: [2, 7],
    });

    expect(await askAboutListing("car-1", "Anything else?", "en", null)).toEqual({
      status: "answered",
      answer: "They also have a K5.",
      actions: [
        { kind: "directions", href: "https://www.google.com/maps/search/?api=1&query=12%20Nile%20St%2C%20Cairo" },
        { kind: "call", href: "tel:01001234567", phone: "0100 123-4567" },
      ],
      cars: [{ id: "car-k5", year: 2021, make: "Kia", model: "K5", price: 900000, currency: "EGP", image: "https://img/k5.jpg" }],
    });
  });

  it("drops a button the dealer's row cannot back", async () => {
    answerListingQuestion.mockResolvedValue({
      grounded: true, answer: "Open 9 to 5.", fieldsUsed: ["workingHours"], actions: ["call"],
    });
    expect(await askAboutListing("car-1", "Hours?", "en", null)).toEqual({ status: "answered", answer: "Open 9 to 5." });
  });

  it("widens the price comparison until it finds enough listings", async () => {
    findComparablePrices
      .mockResolvedValueOnce([900000]) // same model ±1 year: too few
      .mockResolvedValueOnce([880000, 910000]) // same model ±3 years: too few
      .mockResolvedValueOnce([700000, 850000, 950000]); // same make and body type
    await askAboutListing("car-1", "Fair price?", "en", null);

    expect(findComparablePrices).toHaveBeenCalledTimes(3);
    expect(findComparablePrices.mock.calls[2][0]).toMatchObject({ model: undefined, bodyType: "Sedan", yearSpan: 2 });
    expect(answerListingQuestion.mock.calls[0][1].marketPrices.compared).toEqual({
      make: "Toyota", bodyType: "Sedan", years: [2017, 2021],
    });
  });

  it("answers without alternatives or prices when those reads fail", async () => {
    findOtherAvailableCars.mockRejectedValue(new Error("db"));
    findComparablePrices.mockRejectedValue(new Error("db"));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "answered", answer: "White." });
    const facts = answerListingQuestion.mock.calls[0][1];
    // A failed read is unknown, not "none for sale".
    expect(facts).not.toHaveProperty("otherCars");
    expect(facts).not.toHaveProperty("marketPrices");
  });

  it("does not spend when the plan does not offer it", async () => {
    findActiveSubscription.mockResolvedValue(plan(undefined));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "unavailable" });
    expect(answerListingQuestion).not.toHaveBeenCalled();
  });

  it("has no monthly cap: a limit left on an older plan is ignored", async () => {
    findActiveSubscription.mockResolvedValue(plan({ enabled: true, limit: 20 }));
    countOrgAiCarsThisMonth.mockResolvedValue(500);
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "answered", answer: "White." });
    expect(countOrgAiCarsThisMonth).not.toHaveBeenCalled();
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

describe("buttons for a car on sale", () => {
  it("offers a test drive on the listing's own test-drive page, only while it is for sale", async () => {
    answerListingQuestion.mockResolvedValue({
      grounded: true, answer: "You can book a test drive.", fieldsUsed: ["status"], actions: ["testDrive"],
    });
    expect(await askAboutListing("car-1", "Can I try it?", "en", null)).toMatchObject({
      actions: [{ kind: "testDrive", href: "/test-drive?carId=car-1" }],
    });

    findCarForAssistant.mockResolvedValue({ ...car, status: "SOLD" });
    expect(await askAboutListing("car-1", "Can I try it?", "en", null)).not.toHaveProperty("actions");
  });
});

describe("rating answers", () => {
  it("keeps each answer with the question as it stands alone, and hands back its id", async () => {
    recordAssistantAnswer.mockResolvedValue("answer-1");
    answerListingQuestion.mockResolvedValue({
      grounded: true, answer: "White.", fieldsUsed: ["color"], standalone: "What colour is the car?",
    });
    expect(await askAboutListing("car-1", "colour?", "en", null)).toMatchObject({ answerId: "answer-1" });
    expect(recordAssistantAnswer).toHaveBeenCalledWith({
      organizationId: "org-dealer", carId: "car-1", question: "What colour is the car?", answer: "White.", locale: "en",
    });
  });

  it("still answers when the answer cannot be kept, just without a rating", async () => {
    recordAssistantAnswer.mockRejectedValue(new Error("db down"));
    expect(await askAboutListing("car-1", "Colour?", "en", null)).toEqual({ status: "answered", answer: "White." });
  });

  it("files a 👎 answer's question for the dealer to answer", async () => {
    rateAssistantAnswer.mockResolvedValue({
      organizationId: "org-dealer", carId: "car-1", question: "Is it automatic?", locale: "en",
    });
    await rateListingAnswer("answer-1", false);
    expect(rateAssistantAnswer).toHaveBeenCalledWith("answer-1", false);
    expect(recordDeclinedQuestion).toHaveBeenCalledWith({
      organizationId: "org-dealer", carId: "car-1", question: "Is it automatic?", questionKey: "is it automatic", locale: "en",
    });
  });

  it("files nothing for a 👍, or for an answer already rated", async () => {
    rateAssistantAnswer.mockResolvedValue({ organizationId: "o", carId: "c", question: "q", locale: "en" });
    await rateListingAnswer("answer-1", true);
    rateAssistantAnswer.mockResolvedValue(null);
    await rateListingAnswer("answer-1", false);
    expect(recordDeclinedQuestion).not.toHaveBeenCalled();
  });
});
