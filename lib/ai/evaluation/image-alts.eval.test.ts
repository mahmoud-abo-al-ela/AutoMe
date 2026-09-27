import { describe, it, expect, beforeAll, vi, type TestContext } from "vitest";

// Vitest does not read .env; see car-listing.eval.test.ts.
vi.hoisted(() => {
  if (process.env.AI_EVAL && !process.env.GEMINI_API_KEY) {
    require("dotenv").config();
  }
});

import { describeCarImages } from "@/lib/services/ai/describeCarImages";
import type { ImageAlts } from "@/lib/utils/image-alts";
import * as cache from "@/lib/ai/cache";
import { PLATE_TEXT, carPhoto, photoWithArabicPlate } from "@/lib/ai/evaluation/fixtures";
import { containsArabic, firstLeak, isPredominantlyArabic } from "@/lib/ai/evaluation/assertions";
import { CALL_TIMEOUT, EVAL_CALLER, isCapacityFailure } from "@/lib/ai/evaluation/harness";

/**
 * Photo alt text, against the real model.
 *
 *   AI_EVAL=1 npx vitest run lib/ai/evaluation
 *
 * Alt text is read aloud to buyers who cannot see the photo, so the failures
 * that matter are: the Arabic is not Arabic, it runs too long to be read in
 * one breath, or it reads out a plate number the listing must never publish.
 */

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!enabled)("photo alt text (real model)", () => {
  let alts: ImageAlts | "unavailable" | null = null;

  beforeAll(async () => {
    cache.clear();
    try {
      const plate = await photoWithArabicPlate();
      alts = await describeCarImages(
        { year: 2018, make: "Porsche", model: "Panamera Turbo" },
        [
          { url: "clear", ...carPhoto() },
          { url: "plate", ...plate },
        ],
        EVAL_CALLER
      );
    } catch (error) {
      if (!isCapacityFailure(error)) throw error;
      alts = "unavailable";
    }
  }, CALL_TIMEOUT);

  function answered(t: TestContext): ImageAlts {
    if (!alts || alts === "unavailable") t.skip("every model in the chain was unavailable");
    return alts as ImageAlts;
  }

  it("describes every photo", (t) => {
    expect(Object.keys(answered(t)).sort()).toEqual(["clear", "plate"]);
  });

  it("writes the Arabic in Arabic and the English in English", (t) => {
    for (const alt of Object.values(answered(t))) {
      expect(isPredominantlyArabic(alt.ar)).toBe(true);
      expect(containsArabic(alt.en)).toBe(false);
    }
  });

  it("does not mistranslate a three-quarter view as three-dimensional", (t) => {
    // Seen from the model before the prompt named the Arabic view terms.
    for (const alt of Object.values(answered(t))) {
      expect(alt.ar).not.toContain("ثلاثي الأبعاد");
    }
  });

  it("keeps the plate number out of the alt text", (t) => {
    const all = Object.values(answered(t))
      .flatMap((alt) => [alt.en, alt.ar])
      .join("\n");
    expect(firstLeak(all, PLATE_TEXT)).toBeNull();
  });
});
