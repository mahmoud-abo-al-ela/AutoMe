import { describe, it, expect, beforeAll, vi, type TestContext } from "vitest";

// Vitest does not read .env; see car-listing.eval.test.ts.
vi.hoisted(() => {
  if (process.env.AI_EVAL && !process.env.GEMINI_API_KEY) {
    require("dotenv").config();
  }
});

import type { Locale } from "@/i18n/routing";
import { writeWeeklySummary } from "@/lib/services/ai";
import type { WeeklySummary } from "@/lib/ai/schemas/weekly-summary";
import * as cache from "@/lib/ai/cache";
import { containsArabic, isPredominantlyArabic } from "@/lib/ai/evaluation/assertions";
import { CALL_TIMEOUT, EVAL_CALLER, isCapacityFailure } from "@/lib/ai/evaluation/harness";
import { numbersHold } from "@/lib/utils/digest-numbers";

/**
 * The weekly summary paragraph, against the real model.
 *
 *   AI_EVAL=1 npx vitest run lib/ai/evaluation/weekly-summary
 *
 * The failure that matters is a number: "12 test drives" when there were 2 is
 * what a dealer acts on. numbersHold guards it in production — a summary that
 * fails it is dropped — so here it measures how often the model gets it right,
 * because a dropped paragraph is a worse email.
 */

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

const BUSY = {
  carsListed: 3,
  carsAvailable: 14,
  testDriveRequests: 5,
  testDrivesPending: 2,
  assistantAnswers: 18,
  answersHelpful: 11,
  answersUnhelpful: 3,
  questionsNew: 4,
  questionsOpen: 2,
  aiListingsUsed: 6,
  aiListingsLimit: 20,
};
const QUIET = Object.fromEntries(Object.keys(BUSY).map((k) => [k, 0])) as typeof BUSY;
QUIET.carsAvailable = 5;
QUIET.aiListingsLimit = 20;

const CASES: Record<string, { numbers: typeof BUSY; locale: Locale }> = {
  busyArabic: { numbers: BUSY, locale: "ar" },
  busyEnglish: { numbers: BUSY, locale: "en" },
  quietArabic: { numbers: QUIET, locale: "ar" },
  quietEnglish: { numbers: QUIET, locale: "en" },
};

describe.skipIf(!enabled)("weekly summary (real model)", () => {
  const out: Record<string, WeeklySummary | "unavailable"> = {};

  beforeAll(async () => {
    cache.clear();
    for (const [name, c] of Object.entries(CASES)) {
      try {
        out[name] = await writeWeeklySummary(c.numbers, c.locale, EVAL_CALLER);
      } catch (error) {
        if (!isCapacityFailure(error)) throw error;
        out[name] = "unavailable";
      }
    }
  }, CALL_TIMEOUT * Object.keys(CASES).length);

  function written(t: TestContext, name: string): WeeklySummary {
    if (out[name] === "unavailable") t.skip("every model in the chain was unavailable");
    return out[name] as WeeklySummary;
  }

  for (const [name, c] of Object.entries(CASES)) {
    it(`${name}: quotes only real numbers`, (t) => {
      const s = written(t, name);
      const figures = Object.values(c.numbers).filter((v): v is number => typeof v === "number");
      expect(numbersHold(`${s.summary} ${s.tip}`, figures), `${s.summary} | ${s.tip}`).toBe(true);
    });

    it(`${name}: is written in ${c.locale === "ar" ? "Arabic" : "English"}, with a one-sentence tip`, (t) => {
      const s = written(t, name);
      if (c.locale === "ar") {
        expect(isPredominantlyArabic(s.summary)).toBe(true);
        expect(isPredominantlyArabic(s.tip)).toBe(true);
      } else {
        expect(containsArabic(`${s.summary} ${s.tip}`)).toBe(false);
      }
      expect(s.summary.length).toBeGreaterThan(20);
      expect(s.tip.split(/[.!؟?]\s/).length).toBeLessThanOrEqual(2);
      expect(`${s.summary}${s.tip}`).not.toMatch(/!/);
    });
  }
});
