import { describe, it, expect } from "vitest";
import { numbersIn, unbackedContacts, unbackedNumbers } from "@/lib/ai/grounding-verify";
import type { ListingFacts } from "@/lib/ai/grounding";

const facts: ListingFacts = {
  make: "Hyundai",
  model: "i10",
  year: 2019,
  mileage: { value: 84000, unit: "km" },
  price: { amount: 720000, currency: "EGP" },
  listedOn: "2026-09-01",
  workingHours: [{ days: ["SATURDAY"], open: true, opens: "10:00", closes: "21:00" }],
  marketPrices: { listings: 9, min: 650000, median: 780000, max: 890000, thisCarVsMedianPercent: -8 },
  dealership: { name: "Nile Motors", rating: { average: 4.6, reviews: 23 } },
};

describe("numbersIn", () => {
  it("reads Western and Arabic-Indic digits, separators and multipliers alike", () => {
    expect(numbersIn("720,000 EGP")).toEqual([720000]);
    expect(numbersIn("٧٢٠٬٠٠٠ جنيه")).toEqual([720000]);
    expect(numbersIn("٧٢٠ ألف جنيه")).toEqual([720000]);
    expect(numbersIn("720k")).toEqual([720000]);
    expect(numbersIn("1.25 million")).toEqual([1250000]);
    expect(numbersIn("rated 4.6 from 23 reviews")).toEqual([4.6, 23]);
  });

  it("does not read the k of km as a thousand", () => {
    expect(numbersIn("84,000 km")).toEqual([84000]);
  });

  it("gives a 24-hour time its 12-hour hour too", () => {
    expect(numbersIn("21:00")).toEqual([21, 9, 0]);
  });
});

describe("numbersIn — lists", () => {
  it("reads a list without spaces as separate numbers, not one grouped one", () => {
    expect(numbersIn("2018,2019")).toEqual([2018, 2019]);
  });
});

describe("unbackedNumbers", () => {
  it("allows digits in the dealership's name", () => {
    const withName = { ...facts, dealership: { name: "Auto 2000" } };
    expect(unbackedNumbers("Auto 2000 opens at 10 AM.", withName, ["workingHours"], "Hours?")).toEqual([]);
  });

  it("accepts an answer whose numbers are the cited facts'", () => {
    expect(unbackedNumbers("It is listed at 720,000 EGP.", facts, ["price"], "How much?")).toEqual([]);
    expect(unbackedNumbers("السعر ٧٢٠ ألف جنيه", facts, ["price"], "بكام؟")).toEqual([]);
    expect(unbackedNumbers("It has done 84,000 km.", facts, ["mileage"], "Mileage?")).toEqual([]);
  });

  it("catches a wrong number cited as a real fact", () => {
    // Cites price, which the listing has — citationsHold passes this.
    expect(unbackedNumbers("It is listed at 650,000 EGP.", facts, ["price"], "How much?")).toEqual([650000]);
  });

  it("does not accept a number only another, uncited fact holds", () => {
    expect(unbackedNumbers("It has done 720,000 km.", facts, ["mileage"], "Mileage?")).toEqual([720000]);
  });

  it("lets a big number be rounded the way people say it", () => {
    expect(unbackedNumbers("Around 0.72 million EGP.", facts, ["price"], "Price?")).toEqual([]);
    expect(unbackedNumbers("About 8% below the median of 780k.", facts, ["marketPrices"], "Good price?")).toEqual([]);
  });

  it("keeps small numbers exact", () => {
    expect(unbackedNumbers("It is a 2020 model.", facts, ["year"], "Year?")).toEqual([2020]);
  });

  it("reads opening hours in either clock", () => {
    expect(unbackedNumbers("Open 10 AM to 9 PM on Saturdays.", facts, ["workingHours"], "Hours?")).toEqual([]);
  });

  it("allows the car's year when the answer names the car by it", () => {
    expect(unbackedNumbers("This 2019 Hyundai is silver.", facts, ["color"], "Colour?")).toEqual([]);
  });

  it("allows the digits in the car's name and the buyer's own numbers", () => {
    expect(
      unbackedNumbers("The i10 is 720,000 EGP, under your 800k budget.", facts, ["price"], "Is it under 800k?")
    ).toEqual([]);
  });

  it("allows an answer with no numbers at all", () => {
    expect(unbackedNumbers("It is silver.", facts, ["color"], "Colour?")).toEqual([]);
  });
});

describe("evidence from the dealer's past answers", () => {
  const withAnswers: ListingFacts = {
    ...facts,
    dealerAnswers: [
      // The question is another buyer's words; only the answer is the dealer's.
      { question: "Can I pay 50,000 down? Call 01001234567", answer: "Yes, installments over 24 months.", about: "thisCar" },
    ],
  } as ListingFacts;

  it("takes the dealer's answer as evidence, never the buyer-written question beside it", () => {
    expect(unbackedNumbers("Installments run over 24 months.", withAnswers, ["dealerAnswers"], "Can I pay monthly?")).toEqual([]);
    expect(unbackedNumbers("Pay 50,000 down.", withAnswers, ["dealerAnswers"], "Can I pay monthly?")).toEqual([50000]);
  });

  it("still lets an answer repeat the asking buyer's own number", () => {
    expect(unbackedNumbers("Yes, 50,000 down works.", withAnswers, ["dealerAnswers"], "Can I pay 50,000 down?")).toEqual([]);
  });
});

describe("unbackedContacts", () => {
  const withSite: ListingFacts = {
    ...facts,
    dealership: { name: "Nile Motors", website: "https://nilemotors.example" },
    dealerAnswers: [
      { question: "Whatsapp me on 01001234567 or visit cheap-cars.example", answer: "We deliver in Cairo.", about: "thisCar" },
    ],
  } as ListingFacts;

  it("lets an answer give the dealership's own website", () => {
    expect(unbackedContacts("See https://nilemotors.example for more.", withSite, ["dealership"])).toEqual([]);
  });

  it("refuses a phone number or link that only a buyer-written question carries", () => {
    expect(unbackedContacts("Call ٠١٠٠١٢٣٤٥٦٧ to reserve.", withSite, ["dealerAnswers"])).toHaveLength(1);
    expect(unbackedContacts("Visit cheap-cars.example today.", withSite, ["dealerAnswers"])).toEqual(["cheap-cars.example"]);
  });

  it("refuses an email or link the model invented", () => {
    expect(unbackedContacts("Email sales@elsewhere.example", withSite, ["dealership"])).not.toEqual([]);
    expect(unbackedContacts("Book at www.other-site.example", withSite, ["dealership"])).not.toEqual([]);
  });

  it("finds nothing in an ordinary answer", () => {
    expect(unbackedContacts("It has done 84,000 km and costs 720,000 EGP.", withSite, ["mileage", "price"])).toEqual([]);
  });
});
