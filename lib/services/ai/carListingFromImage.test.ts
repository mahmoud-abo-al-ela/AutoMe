import { describe, it, expect } from "vitest";
import {
  CAR_LISTING_FIELDS,
  countWrittenFields,
  yearWithinGeneration,
} from "@/lib/services/ai/carListingFromImage";

describe("yearWithinGeneration", () => {
  it("keeps a year the model placed inside its generation", () => {
    expect(yearWithinGeneration({ yearFrom: 2018, yearTo: 2021, year: 2019 })).toEqual({
      yearFrom: 2018, yearTo: 2021, year: 2019,
    });
  });

  it("moves a year outside the generation to its nearest end", () => {
    expect(yearWithinGeneration({ yearFrom: 2018, yearTo: 2021, year: 2023 }).year).toBe(2021);
    expect(yearWithinGeneration({ yearFrom: 2018, yearTo: 2021, year: 2015 }).year).toBe(2018);
  });

  it("reads a range written backwards", () => {
    expect(yearWithinGeneration({ yearFrom: 2021, yearTo: 2018, year: 2019 })).toEqual({
      yearFrom: 2018, yearTo: 2021, year: 2019,
    });
  });

  it("reaches the reasoning field before the car it names", () => {
    expect(CAR_LISTING_FIELDS.slice(0, 3)).toEqual(["identification", "make", "model"]);
  });
});

describe("countWrittenFields", () => {
  it("counts the fields a partial reply has reached", () => {
    expect(countWrittenFields("")).toBe(0);
    expect(countWrittenFields('{"make":"Kia","model":"Ri')).toBe(2);
  });

  it("reaches the total on a complete reply", () => {
    const complete = JSON.stringify(Object.fromEntries(CAR_LISTING_FIELDS.map((k) => [k, ""])));
    expect(countWrittenFields(complete)).toBe(CAR_LISTING_FIELDS.length);
  });

  it("does not count a key that is only half written", () => {
    // "mod is not yet "model" — the field has not started.
    expect(countWrittenFields('{"make":"Kia","mod')).toBe(1);
  });
});
