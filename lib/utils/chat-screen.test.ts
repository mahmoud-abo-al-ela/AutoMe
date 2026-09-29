import { describe, it, expect } from "vitest";
import { screenChatMessage } from "@/lib/utils/chat-screen";

describe("screenChatMessage", () => {
  it("leaves ordinary car talk alone, in both languages", () => {
    for (const text of [
      "العربية لسه متاحة؟",
      "ممكن أجي أعاينها بكرة الساعة ٥؟",
      "السعر فيه فصال ولا ده آخر كلام؟",
      "Is it still available?",
      "We can do 600k cash, and that's our final price.",
      "تمام يا باشا 👍",
    ]) {
      expect(screenChatMessage(text), text).toEqual([]);
    }
  });

  it("routes money-transfer requests, however they are spelled", () => {
    expect(screenChatMessage("حول العربون على فودافون كاش")).toContain("payment");
    expect(screenChatMessage("ابعتلي فلوس الحجز الأول")).toContain("payment");
    expect(screenChatMessage("Please send a deposit via Western Union first")).toContain("payment");
    // Folding: ة/ه and Arabic-Indic digits do not hide a term.
    expect(screenChatMessage("ادفع مقدم حجز ٥٠٠٠ على المحفظة")).toContain("payment");
  });

  it("routes links, prizes, requests for codes, and flooding", () => {
    expect(screenChatMessage("شوف الصور هنا bit.ly/abc")).toContain("link");
    expect(screenChatMessage("https://example.com/pay")).toContain("link");
    expect(screenChatMessage("مبروك كسبت جائزة")).toContain("prize");
    expect(screenChatMessage("ابعتلي كود التفعيل اللي جالك")).toContain("credentials");
    expect(screenChatMessage("Send me the OTP")).toContain("credentials");
    expect(screenChatMessage("ردددددددددد")).toContain("flood");
  });

  it("routes insults and threats", () => {
    expect(screenChatMessage("انت حيوان")).toContain("abuse");
    expect(screenChatMessage("you idiot")).toContain("abuse");
    expect(screenChatMessage("والله هتندم")).toContain("threat");
  });
});
