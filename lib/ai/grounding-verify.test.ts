import { describe, it, expect } from "vitest";
import { numbersIn, unbackedNumbers } from "@/lib/ai/grounding-verify";
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

describe("unbackedNumbers", () => {
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
