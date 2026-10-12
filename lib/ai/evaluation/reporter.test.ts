import { describe, it, expect } from "vitest";
import { failureNote } from "@/lib/ai/evaluation/reporter";

describe("failureNote", () => {
  it("keeps the message's words, on one line", () => {
    // The first version's whitespace pattern lost its backslash and ate every "s".
    expect(failureNote([{ message: "noBmw should be answered:\n  expected false\tto be true" }])).toBe(
      "noBmw should be answered: expected false to be true"
    );
  });

  it("caps a long message and marks the cut", () => {
    const note = failureNote([{ message: "x".repeat(700) }]);
    expect(note).toHaveLength(601);
    expect(note?.endsWith("…")).toBe(true);
  });

  it("is nothing without a message", () => {
    expect(failureNote(undefined)).toBeUndefined();
    expect(failureNote([{ message: "   " }])).toBeUndefined();
  });
});
