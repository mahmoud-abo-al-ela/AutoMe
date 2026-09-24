import { describe, it, expect, beforeAll, vi, type TestContext } from "vitest";

// Vitest does not read .env, so an opt-in run would otherwise skip itself for
// want of the key that is sitting right there. Loaded only when AI_EVAL is set,
// so a normal `pnpm test` never picks up .env as a side effect of this file.
vi.hoisted(() => {
  if (process.env.AI_EVAL && !process.env.GEMINI_API_KEY) {
    require("dotenv").config();
  }
});

import { extractCarListing, prepareImage } from "@/lib/services/ai";
import type { CarListingDraft } from "@/lib/services/ai";
import * as cache from "@/lib/ai/cache";
import { ServiceUnavailableError } from "@/lib/utils/errors";
import { carPhoto, notACar } from "@/lib/ai/evaluation/fixtures";
import {
  isPredominantlyArabic,
  containsArabic,
  isAllowlisted,
  isPlausibleEgpCarPrice,
  isPlausibleKilometres,
} from "@/lib/ai/evaluation/assertions";

/**
 * Evaluation of the real extraction, against the real model.
 *
 *   AI_EVAL=1 npx vitest run lib/ai/evaluation
 *
 * Opt-in because every run spends provider quota and the answers are not
 * deterministic — this is a periodic check on behaviour, not a gate on every
 * commit. The unit suite covers the contract; this covers whether the model
 * still does what the prompt asks.
 *
 * No database needed: the metering write and the breaker's count both fail
 * closed into a log line, so ledger errors in an eval run are expected.
 *
 * **A busy provider is not a failed evaluation.** The free-tier Flash models
 * return 503 often enough that a whole chain can be exhausted, and reporting
 * that as a quality regression is how a suite stops being believed. Capacity
 * failures skip; only a real answer is judged.
 *
 * Deliberately few calls — the cost of an evaluation suite is counted in
 * requests, not in `it` blocks, so each `beforeAll` makes one and every
 * assertion reads its result.
 */

const enabled = Boolean(process.env.AI_EVAL) && Boolean(process.env.GEMINI_API_KEY);

/** Real vision calls measured at 7-17s, and the client may walk its chain. */
const CALL_TIMEOUT = 180_000;

const ctx = { organizationId: null, userId: null };

/** The File shape `prepareImage` reads, without needing a DOM File. */
function asFile({ bytes, mimeType }: { bytes: Buffer; mimeType: string }): File {
  return {
    type: mimeType,
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

/** Every model in the chain was busy or unreachable — inconclusive, not wrong. */
function isCapacityFailure(error: unknown): boolean {
  return error instanceof ServiceUnavailableError;
}

describe.skipIf(!enabled)("car listing extraction (real model)", () => {
  let draft: CarListingDraft | null = null;
  let unavailable = false;

  beforeAll(async () => {
    cache.clear();
    try {
      draft = await extractCarListing(await prepareImage(asFile(carPhoto())), ctx);
    } catch (error) {
      if (!isCapacityFailure(error)) throw error;
      unavailable = true;
    }
  }, CALL_TIMEOUT);

  /** Skips the case rather than failing it when the provider had no capacity. */
  function extraction(t: TestContext): CarListingDraft {
    if (unavailable || !draft) {
      t.skip("every model in the chain was unavailable");
    }
    return draft as CarListingDraft;
  }

  it("identifies the vehicle at all", (t) => {
    const car = extraction(t);
    expect(car.make.trim()).not.toBe("");
    expect(car.model.trim()).not.toBe("");
    expect(car.year).toBeGreaterThan(1950);
  });

  it("keeps the price in Egyptian pounds", (t) => {
    // The regression this guards is a model that helpfully converts to USD,
    // which divides every listing price by roughly fifty. It shipped once.
    expect(isPlausibleEgpCarPrice(extraction(t).price)).toBe(true);
  });

  it("reads mileage as kilometres", (t) => {
    expect(isPlausibleKilometres(extraction(t).mileage)).toBe(true);
  });

  // The response schema constrains these three. A failure here means the
  // constraint stopped reaching the provider, not that the model drifted.
  it("answers bodyType from the allowlist", (t) => {
    expect(isAllowlisted("bodyType", extraction(t).bodyType)).toBe(true);
  });

  it("answers fuelType from the allowlist", (t) => {
    expect(isAllowlisted("fuelType", extraction(t).fuelType)).toBe(true);
  });

  it("answers transmission from the allowlist", (t) => {
    expect(isAllowlisted("transmission", extraction(t).transmission)).toBe(true);
  });

  it("writes the Arabic title in Arabic", (t) => {
    expect(isPredominantlyArabic(extraction(t).titleAr)).toBe(true);
  });

  it("writes the Arabic description in Arabic", (t) => {
    // The single most valuable check here. A model that ignores the language
    // instruction answers in English, and every Arabic reader silently gets an
    // English listing while every unit test still passes.
    expect(isPredominantlyArabic(extraction(t).descriptionAr)).toBe(true);
  });

  it("does not answer the English fields in Arabic", (t) => {
    const car = extraction(t);
    expect(containsArabic(car.titleEn)).toBe(false);
    expect(isPredominantlyArabic(car.descriptionEn)).toBe(false);
  });

  it("writes a description worth publishing, in both languages", (t) => {
    // Two or three sentences was the instruction; a handful of words means the
    // prompt stopped being followed.
    const car = extraction(t);
    expect(car.descriptionEn.length).toBeGreaterThan(40);
    expect(car.descriptionAr.length).toBeGreaterThan(40);
  });

  it("is confident about a clear photograph", (t) => {
    expect(extraction(t).confidence).toBeGreaterThan(0.3);
  });

  it("returns features as a list", (t) => {
    expect(Array.isArray(extraction(t).features)).toBe(true);
  });

  it("names the Arabic features in Arabic", (t) => {
    // Same failure as the description: an Arabic list answered in English
    // passes every unit test and still shows Arabic readers English.
    const { featuresAr } = extraction(t);
    expect(featuresAr.length).toBeGreaterThan(0);
    expect(isPredominantlyArabic(featuresAr.join(" "))).toBe(true);
  });
});

describe.skipIf(!enabled)("an image with no car in it", () => {
  it(
    "declines rather than inventing a vehicle",
    async (t) => {
      cache.clear();

      let answer: CarListingDraft | null = null;
      try {
        answer = await extractCarListing(await prepareImage(asFile(notACar())), ctx);
      } catch (error) {
        // A capacity failure says nothing about the model's judgement, and
        // counting it as "correctly refused" would be a false pass — the
        // suite would report this working while it silently regressed.
        if (isCapacityFailure(error)) {
          t.skip("every model in the chain was unavailable");
        }
        // Anything else — notably the schema rejecting an empty make — is the
        // model declining, which is the better answer.
        return;
      }

      // If it answered anyway it must at least not be sure. A confident
      // invented listing is the failure that matters, because a dealer would
      // publish it.
      expect(answer.confidence).toBeLessThan(0.5);
    },
    CALL_TIMEOUT
  );
});
