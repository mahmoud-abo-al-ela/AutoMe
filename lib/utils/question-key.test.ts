import { describe, it, expect } from "vitest";
import { questionKey } from "@/lib/utils/question-key";

describe("questionKey", () => {
  it("folds case, spacing and trailing punctuation", () => {
    expect(questionKey("  Is the price   NEGOTIABLE?? ")).toBe("is the price negotiable");
  });

  it("folds Arabic spelling variants and the Arabic question mark", () => {
    expect(questionKey("هل السعر قابل للتفاوض؟")).toBe(questionKey("هل السعر قابل للتفاوض"));
    expect(questionKey("إمتى المعرض بيفتح")).toBe(questionKey("امتى المعرض بيفتح"));
  });

  it("keeps differently worded questions apart", () => {
    expect(questionKey("Is the price negotiable?")).not.toBe(questionKey("Can I haggle?"));
  });
});
