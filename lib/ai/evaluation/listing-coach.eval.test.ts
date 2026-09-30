import { describe, it, expect, beforeAll, vi, type TestContext } from "vitest";

// Vitest does not read .env; see car-listing.eval.test.ts.
vi.hoisted(() => {
  if (process.env.AI_EVAL && !process.env.GEMINI_API_KEY) {
    require("dotenv").config();
  }
});

import { coachListing } from "@/lib/services/ai/coachListing";
import { reviewListing, type ListingIssueCode } from "@/lib/services/car/listing-quality";
import * as cache from "@/lib/ai/cache";
import { containsArabic, containsWesternDigits, isPredominantlyArabic } from "@/lib/ai/evaluation/assertions";
import { CALL_TIMEOUT, EVAL_CALLER, isCapacityFailure } from "@/lib/ai/evaluation/harness";

/**
 * The listing-quality coach's advice, against the real model.
 *
 *   AI_EVAL=1 npx vitest run lib/ai/evaluation
 *
 * The rules decide what is weak; this checks that the advice for it arrives
 * for every flagged issue and in the dealer's language.
 */

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

const WEAK_LISTING = {
  year: 2019,
  make: "Hyundai",
  model: "Elantra",
  mileage: 0,
  bodyType: "Sedan",
  description: "عربية نضيفة جدا",
  features: ["فتحة سقف"],
  imageCount: 2,
};

type Advice = Partial<Record<ListingIssueCode, string>>;

describe.skipIf(!enabled)("listing coach advice (real model)", () => {
  const flagged = reviewListing(WEAK_LISTING).issues.map((issue) => issue.code);
  let arabic: Advice | "unavailable" | null = null;
  let english: Advice | "unavailable" | null = null;

  beforeAll(async () => {
    cache.clear();
    const ask = async (language: "en" | "ar") => {
      try {
        return await coachListing(WEAK_LISTING, flagged, language, EVAL_CALLER);
      } catch (error) {
        if (isCapacityFailure(error)) return "unavailable" as const;
        throw error;
      }
    };
    arabic = await ask("ar");
    english = await ask("en");
  }, CALL_TIMEOUT * 2);

  function answered(t: TestContext, advice: Advice | "unavailable" | null): Advice {
    if (!advice || advice === "unavailable") t.skip("every model in the chain was unavailable");
    return advice as Advice;
  }

  it("advises on every issue the rules flagged", (t) => {
    expect(Object.keys(answered(t, arabic)).sort()).toEqual([...flagged].sort());
  });

  it("writes Arabic advice in Arabic, with Arabic digits", (t) => {
    for (const text of Object.values(answered(t, arabic))) {
      expect(isPredominantlyArabic(text!)).toBe(true);
      expect(containsWesternDigits(text!)).toBe(false);
    }
  });

  it("writes English advice in English", (t) => {
    for (const text of Object.values(answered(t, english))) {
      expect(containsArabic(text!)).toBe(false);
    }
  });
});
