import { describe, it, expect } from "vitest";
import {
  MAX_TRANSLATABLE_CHARS,
  currentTranslation,
  isTranslatable,
} from "@/lib/utils/chat-translation";

describe("isTranslatable", () => {
  it("offers a translation into the other language only", () => {
    expect(isTranslatable("العربية فابريكا؟", "en")).toBe(true);
    expect(isTranslatable("العربية فابريكا؟", "ar")).toBe(false);
    expect(isTranslatable("Is it negotiable?", "ar")).toBe(true);
    expect(isTranslatable("Is it negotiable?", "en")).toBe(false);
  });

  it("offers nothing for an empty, letterless or overlong message", () => {
    expect(isTranslatable("", "en")).toBe(false);
    expect(isTranslatable("👍", "ar")).toBe(false);
    expect(isTranslatable("ا".repeat(MAX_TRANSLATABLE_CHARS + 1), "en")).toBe(false);
  });
});

describe("currentTranslation", () => {
  it("returns a saved translation only while it matches the text", () => {
    const saved = { en: { text: "Is it still available?", source: "لسه موجودة؟" } };
    expect(currentTranslation(saved, "لسه موجودة؟", "en")).toBe("Is it still available?");
    expect(currentTranslation(saved, "لسه موجودة يا باشا؟", "en")).toBeNull();
    expect(currentTranslation(saved, "لسه موجودة؟", "ar")).toBeNull();
    expect(currentTranslation(undefined, "لسه موجودة؟", "en")).toBeNull();
  });
});
