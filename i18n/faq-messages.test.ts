import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import en from "@/messages/en/faq.json";
import ar from "@/messages/ar/faq.json";
import {
  FAQ_AI_POINTS,
  FAQ_CATEGORIES,
} from "@/app/[locale]/(site)/faq/_lib/faq-items";
import { formatNumber } from "@/lib/utils/number";
import { MAX_COMPARE_CARS } from "@/lib/utils";

/**
 * The FAQ page builds its keys from the id lists, so a key that is missing
 * reaches the page as the raw key path — nothing else would catch it.
 */

const LOCALES = { en, ar } as const;

describe("faq messages", () => {
  for (const [locale, messages] of Object.entries(LOCALES)) {
    const t = createTranslator({ locale, messages: { faq: messages }, namespace: "faq" });

    it(`${locale}: has a heading, question and answer for every listed id`, () => {
      for (const category of FAQ_CATEGORIES) {
        expect(messages.categories).toHaveProperty(category.key);
        for (const item of category.items) {
          expect(messages.items[item].q).toBeTruthy();
          expect(messages.items[item].a).toBeTruthy();
        }
      }
      for (const point of FAQ_AI_POINTS) {
        expect(messages.items.ai.points[point]).toBeTruthy();
      }
    });

    it(`${locale}: fills the brand everywhere it is asked for`, () => {
      for (const category of FAQ_CATEGORIES) {
        for (const item of category.items) {
          if (item === "compare" || item === "security") continue;
          const text = t(`items.${item}.q`, { brand: "Mo Motors" }) +
            t(`items.${item}.a`, { brand: "Mo Motors" });
          expect(text).not.toContain("{brand}");
        }
      }
    });
  }

  it("states the compare limit the tray enforces, in each locale's digits", () => {
    const answer = (locale: "en" | "ar") =>
      createTranslator({ locale, messages: { faq: LOCALES[locale] }, namespace: "faq" })(
        "items.compare.a",
        { count: MAX_COMPARE_CARS, max: formatNumber(MAX_COMPARE_CARS, locale) }
      );

    expect(answer("en")).toContain(`${MAX_COMPARE_CARS} cars`);
    // Arabic counts 3-10 with a plural noun: "٣ سيارات", not "٣ سيارة".
    expect(answer("ar")).toContain(`${formatNumber(MAX_COMPARE_CARS, "ar")} سيارات`);
  });

  it("makes no promise the product does not keep", () => {
    // The English these replaced, on the FAQ page and the home page's old FAQ
    // (whose buying questions now live on the FAQ page).
    // Each was a feature, process or partnership that never existed.
    const text = JSON.stringify(en).toLowerCase();
    for (const claim of [
      "facebook",
      "driving habit",
      "maintenance",
      "depreciation",
      "up to 5",
      "verification process",
      "partner lenders",
      "buyer protection",
      "millions of",
      "peer-to-peer",
    ]) {
      expect(text).not.toContain(claim);
    }
  });

  it("keeps the Arabic free of the same claims", () => {
    // "موثّقة" (verified), "شركائنا" (our partners), "حماية للمشتري"
    // (buyer protection), "ملايين" (millions).
    const text = JSON.stringify(ar);
    for (const claim of ["موثّقة", "شركائنا", "حماية للمشتري", "ملايين"]) {
      expect(text).not.toContain(claim);
    }
  });
});
