import { describe, it, expect } from "vitest";
import {
  UNSET,
  disclosuresFromForm,
  disclosuresToForm,
  licenseMonth,
  licenseMonthToDate,
  statedDisclosures,
  statedTerms,
} from "@/lib/utils/car-disclosures";
import { updateCarFullSchema } from "@/lib/validations/schemas";

describe("car disclosures", () => {
  it("keeps 'not stated' apart from 'no' through the form and back", () => {
    const stored = {
      originalPaint: false,
      accidentFree: null,
      ownerCount: 2,
      serviceHistory: "PARTIAL" as const,
      priceNegotiable: true,
      licenseValidUntil: "2027-03",
    };
    const form = disclosuresToForm(stored);
    expect(form).toEqual({
      originalPaint: "no",
      accidentFree: UNSET,
      ownerCount: "2",
      serviceHistory: "PARTIAL",
      priceNegotiable: "yes",
      licenseValidUntil: "2027-03",
    });
    expect(disclosuresFromForm(form)).toEqual(stored);
  });

  it("sends every field as null when nothing is stated, so a save can clear them", () => {
    expect(disclosuresFromForm({})).toEqual({
      originalPaint: null,
      accidentFree: null,
      ownerCount: null,
      serviceHistory: null,
      priceNegotiable: null,
      licenseValidUntil: null,
    });
  });

  it("stores the licence month as the first of the month, and reads it back in UTC", () => {
    const date = licenseMonthToDate("2027-03")!;
    expect(date.toISOString()).toBe("2027-03-01T00:00:00.000Z");
    expect(licenseMonth(date)).toBe("2027-03");
    expect(licenseMonth(date.toISOString())).toBe("2027-03");
    expect(licenseMonthToDate("March 2027")).toBeNull();
  });

  it("drops what was not stated, and keeps a stated no", () => {
    expect(statedDisclosures({ accidentFree: false, originalPaint: null, ownerCount: null })).toEqual({
      accidentFree: false,
    });
  });

  it("keeps a financing note only beside 'offers financing: yes'", () => {
    expect(statedTerms({ offersFinancing: true, financingNote: " NBE " })).toEqual({
      offersFinancing: true,
      financingNote: "NBE",
    });
    expect(statedTerms({ offersFinancing: false, financingNote: "NBE", acceptsTradeIn: null })).toEqual({
      offersFinancing: false,
    });
  });

  it("is accepted by the server schema exactly as the form sends it", () => {
    // Guards the licence regex: a lost backslash once made it reject every month.
    const car = {
      title: "Hyundai Elantra 2019", make: "Hyundai", model: "Elantra", year: 2019, price: 720000,
      mileage: 84000, bodyType: "Sedan", fuelType: "Petrol", transmission: "Automatic",
      color: "Silver", seats: 5, description: "A clean, well kept car.", images: [],
    };
    const ok = updateCarFullSchema.safeParse({ ...car, ...disclosuresFromForm({ licenseValidUntil: "2027-03", ownerCount: "2" }) });
    expect(ok.success).toBe(true);
    expect(updateCarFullSchema.safeParse({ ...car, licenseValidUntil: "2027-13" }).success).toBe(false);
  });
});
