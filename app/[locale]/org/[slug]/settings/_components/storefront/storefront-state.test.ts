import { describe, expect, it } from "vitest";
import {
  changedParts,
  groupHours,
  hoursFromStored,
  invalidDays,
  profileFromStored,
  termsFromStored,
  termsToInput,
  unstatedTerms,
  type StorefrontState,
} from "./storefront-state";

const state = (): StorefrontState => ({
  profile: profileFromStored({ name: "Mo Motors" }),
  hours: hoursFromStored([]),
  terms: termsFromStored({ offersFinancing: true, financingNote: "NBE", acceptsTradeIn: false }),
});

describe("storefront state", () => {
  it("starts a dealership with no hours on 9 to 6, Friday closed", () => {
    const hours = hoursFromStored(null);
    expect(hours.SATURDAY).toEqual({ isOpen: true, openTime: "09:00", closeTime: "18:00" });
    expect(hours.FRIDAY.isOpen).toBe(false);
  });

  it("spreads a stored row that covers several days onto each of them", () => {
    const hours = hoursFromStored([{ dayOfWeek: ["SUNDAY", "MONDAY"], openTime: "10:00", closeTime: "21:00", isOpen: true }]);
    expect(hours.SUNDAY.closeTime).toBe("21:00");
    expect(hours.MONDAY.closeTime).toBe("21:00");
    expect(hours.TUESDAY.closeTime).toBe("18:00");
  });

  it("groups neighbouring days with the same hours, and closed days together", () => {
    const hours = hoursFromStored([]);
    hours.WEDNESDAY.closeTime = "22:00";
    expect(groupHours(hours).map((group) => [group.days.length, group.isOpen])).toEqual([
      [4, true],
      [1, true],
      [1, true],
      [1, false],
    ]);
  });

  it("flags open days that close before they open, and ignores closed ones", () => {
    const hours = hoursFromStored([]);
    hours.MONDAY.closeTime = "08:00";
    hours.FRIDAY.closeTime = "01:00";
    expect(invalidDays(hours)).toEqual(["MONDAY"]);
  });

  it("drops the financing note unless financing is offered", () => {
    const terms = termsFromStored({ offersFinancing: true, financingNote: " NBE " });
    expect(termsToInput(terms).financingNote).toBe("NBE");
    expect(termsToInput({ ...terms, offersFinancing: "no" }).financingNote).toBeNull();
  });

  it("lists the terms left not stated", () => {
    expect(unstatedTerms(state().terms)).toEqual(["allowsInspection", "offersDelivery"]);
  });

  it("reports only the parts that would send something different", () => {
    const saved = state();
    const current = state();
    expect(changedParts(current, saved)).toEqual([]);

    current.hours.MONDAY.closeTime = "22:00";
    expect(changedParts(current, saved)).toEqual(["hours"]);

    // A note typed while financing is "no" is never sent, so it alone is no change.
    const savedNo = { ...saved, terms: { ...saved.terms, offersFinancing: "no" as const } };
    const typed = { ...savedNo, terms: { ...savedNo.terms, financingNote: "typed" } };
    expect(changedParts(typed, savedNo)).toEqual([]);
  });
});
