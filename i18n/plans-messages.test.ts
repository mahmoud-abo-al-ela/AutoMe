import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import enPlans from "@/messages/en/plans.json";
import arPlans from "@/messages/ar/plans.json";

/**
 * The plan limits are rendered on the pricing page, in onboarding, in billing
 * and in super-admin, always with `{ count, value }`: the raw count picks the
 * plural form and `value` is the count already in the reader's numerals.
 *
 * They were `{value} صور لكل سيارة` with no plural, which reads "١٢ صور" — 3–10
 * takes صور, 11–99 takes صورة. Arabic has six plural categories; these pin
 * that each one is reached and that no form is missing its count.
 */

const LIMIT_KEYS = [
  "carListings",
  "teamMembers",
  "imagesPerCar",
  "auditLogs",
  "aiProcessingMonthly",
] as const;

// zero, one, two, few (3–10), many (11–99), other (100+).
const ARABIC_SAMPLES = [0, 1, 2, 3, 11, 100];

const translate = (locale: "en" | "ar") =>
  createTranslator({
    locale,
    messages: { plans: locale === "en" ? enPlans : arPlans },
    namespace: "plans.features",
  });

describe("plan limit messages", () => {
  it.each(LIMIT_KEYS)("%s agrees with its count in Arabic", (key) => {
    const t = translate("ar");
    // Same value for every count, so only the chosen form can differ.
    const forms = ARABIC_SAMPLES.map((count) => t(key, { count, value: "N" }));

    // 3–10 takes the plural noun, 100+ the singular: the bug was one form
    // ("١٢ صور") for both.
    expect(forms[3]).not.toBe(forms[5]);
    // One and two are spelled out rather than numbered.
    expect(forms[1]).not.toContain("N");
    expect(forms[2]).not.toContain("N");
    for (const form of forms) expect(form).not.toContain("#");
  });

  it.each(LIMIT_KEYS)("%s shows the formatted value for counts of three or more", (key) => {
    for (const locale of ["en", "ar"] as const) {
      const t = translate(locale);
      expect(t(key, { count: 12, value: "<12>" })).toContain("<12>");
    }
  });

  it("uses the singular in English for one", () => {
    const t = translate("en");
    expect(t("imagesPerCar", { count: 1, value: "1" })).toBe("1 image per car");
    expect(t("imagesPerCar", { count: 12, value: "12" })).toBe("12 images per car");
  });
});
