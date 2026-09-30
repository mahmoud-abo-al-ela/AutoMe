import { describe, it, expect } from "vitest";
import { detectTextLanguage } from "@/lib/utils/text-language";

describe("detectTextLanguage", () => {
  it("reads Egyptian Arabic as Arabic", () => {
    expect(detectTextLanguage("العربية لسه موجودة ولا اتباعت؟")).toBe("ar");
  });

  it("reads an Arabic sentence with a Latin model name as Arabic", () => {
    expect(detectTextLanguage("لو هبدل عربيتي Verna 2015 تاخدوها بكام؟")).toBe("ar");
  });

  it("reads English as English", () => {
    expect(detectTextLanguage("Is the price negotiable?")).toBe("en");
    expect(detectTextLanguage("ok 👍")).toBe("en");
  });

  it("finds no language in digits, emoji or punctuation", () => {
    expect(detectTextLanguage("٥٥٠٠٠")).toBeNull();
    expect(detectTextLanguage("600000")).toBeNull();
    expect(detectTextLanguage("👍🙏")).toBeNull();
    expect(detectTextLanguage("؟؟؟")).toBeNull();
    expect(detectTextLanguage("")).toBeNull();
  });
});
