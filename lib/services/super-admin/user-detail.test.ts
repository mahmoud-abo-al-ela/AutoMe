import { describe, expect, it } from "vitest";
import { userTabs } from "./user-detail";

const person = { role: "USER", memberships: [] as unknown[], savedCars: 0, testDrives: 0, reviews: 0 };

describe("a person's tabs", () => {
  it("gives a buyer their test drives, saved cars and reviews, even with none yet", () => {
    expect(userTabs(person)).toEqual(["summary", "drives", "saved", "reviews"]);
  });

  it("gives dealership staff their dealerships and activity, and buyer tabs only if they browsed", () => {
    expect(userTabs({ ...person, memberships: [{}] })).toEqual(["summary", "dealerships", "activity"]);
    expect(userTabs({ ...person, memberships: [{}], savedCars: 2 })).toEqual(["summary", "dealerships", "drives", "saved", "reviews", "activity"]);
  });

  it("gives AutoMe staff their support sessions and activity", () => {
    expect(userTabs({ ...person, role: "ADMIN" })).toEqual(["summary", "sessions", "activity"]);
  });
});
