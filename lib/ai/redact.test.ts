import { describe, it, expect } from "vitest";
import { redactParts, redactText } from "@/lib/ai/redact";
import { imagePart, textPart } from "@/lib/ai/provider/types";

describe("redactText", () => {
  it("replaces emails, phone numbers in either digit set, and links", () => {
    expect(redactText("Call me on 0100 123 4567 or ٠١٠٠١٢٣٤٥٦٧")).toBe("Call me on [phone] or [phone]");
    expect(redactText("mail a.b+c@example.co.uk now")).toBe("mail [email] now");
    expect(redactText("see https://evil.example/x and www.x.com")).toBe("see [link] and [link]");
  });

  it("keeps the numbers a listing is made of", () => {
    expect(redactText("2019, 84,000 km, 720,000 EGP")).toBe("2019, 84,000 km, 720,000 EGP");
    expect(redactText('{"price":{"amount":1250000}}')).toBe('{"price":{"amount":1250000}}');
    expect(redactText("+20 100 123 4567")).toBe("[phone]");
  });

  it("caps a huge input", () => {
    expect(redactText("x".repeat(30_000)).length).toBeLessThan(20_100);
  });
});

describe("redactParts", () => {
  it("keeps text parts and reduces a photo to its type, size and digest", () => {
    const photo = Buffer.from("not really a jpeg").toString("base64");
    const out = redactParts([imagePart(photo, "image/jpeg"), textPart('"What colour?"')]);
    expect(out).toMatch(/^\[image image\/jpeg, \d+ bytes, sha256 [0-9a-f]{16}\]\n---\n"What colour\?"$/);
    expect(out).not.toContain(photo);
  });
});
