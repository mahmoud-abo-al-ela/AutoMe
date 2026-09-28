import { describe, it, expect } from "vitest";
import { classifyBuyerMessage } from "@/lib/utils/buyer-message";

describe("classifyBuyerMessage", () => {
  it.each([
    ["السلام عليكم", "greeting"],
    ["ازيك؟", "greeting"],
    ["Hi!", "greeting"],
    ["how are u", "greeting"],
    ["عامل ايه؟", "greeting"],
    ["شكراً", "thanks"],
    ["thank you 🙏", "thanks"],
    ["test", "noise"],
    ["تجربة", "noise"],
    ["؟؟؟", "noise"],
    ["👍👍", "noise"],
    ["123", "noise"],
    ["aaaaaaa", "noise"],
    ["ههههههه", "noise"],
  ])("%s → %s", (text, kind) => {
    expect(classifyBuyerMessage(text)).toBe(kind);
  });

  it.each([
    "Has it been in an accident?",
    "العربية فابريكا؟",
    "بكام؟",
    "hi, is it automatic?",
    "السلام عليكم، العربية لسه موجودة؟",
    "Is it still available",
  ])("sends a real question to the model: %s", (text) => {
    expect(classifyBuyerMessage(text)).toBe("question");
  });
});
