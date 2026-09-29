import { describe, it, expect } from "vitest";
import { numbersHold } from "@/lib/utils/digest-numbers";

describe("numbersHold", () => {
  const week = [3, 12, 0, 1500];

  it("accepts a summary whose numbers are all real, in either digit set", () => {
    expect(numbersHold("You listed 3 cars and have 12 available.", week)).toBe(true);
    expect(numbersHold("أضفت ٣ عربيات وعندك ١٢ متاحة.", week)).toBe(true);
    expect(numbersHold("No test drives this week.", week)).toBe(true);
    expect(numbersHold("1,500 in total", week)).toBe(true);
  });

  it("rejects a summary with a number the week does not have", () => {
    expect(numbersHold("You got 13 test drive requests.", week)).toBe(false);
    expect(numbersHold("عندك ٥ أسئلة مفتوحة", week)).toBe(false);
  });
});
