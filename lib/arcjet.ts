import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";


export const arcjetConfigured = Boolean(process.env.ARCJET_KEY);

export const arcjetRequired = process.env.NODE_ENV === "production";

const arcjetMode = process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN";

const aj = arcjet({
  // Kept out of the constructor's way when absent: `arcjetConfigured` above is
  // what decides whether a request may proceed without a verdict.
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"], // track requests by IP address
  rules: [
    shield({
      mode: arcjetMode,
    }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      refillRate: 10, // refill 10 tokens per interval
      interval: 3600, // per hour
      capacity: 10, // bucket maximum capacity of 10 tokens
    }),
  ],
});

export default aj;

/**
 * Buyer questions on a listing. Its own client rather than `aj.withRule`,
 * because that would also spend the shared bucket above: ten questions would
 * lock a buyer out of the photo search for an hour.
 *
 * Two buckets, because an answer is billed to the dealer. Per IP stops one
 * buyer asking all day; per car stops a crowd (or one buyer rotating IPs)
 * from emptying a dealer's monthly allowance through one listing.
 */
export const ajListingQuestions = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: arcjetMode }),
    detectBot({ mode: arcjetMode, allow: [] }),
    tokenBucket({
      mode: "LIVE",
      characteristics: ["ip.src"],
      refillRate: 20,
      interval: 3600,
      capacity: 20,
    }),
    tokenBucket({
      mode: "LIVE",
      characteristics: ["carId"],
      refillRate: 30,
      interval: 3600,
      capacity: 30,
    }),
  ],
});

/**
 * A dealer's AI work: the add-car photo read, a bulk import's sort and each
 * car it reads, the translation and the listing coach. Its own client, like
 * the buyer questions, because the shared bucket above — 10 an hour, refilled
 * all at once on the hour — let one 5-car import (six requests) and a second
 * one lock a dealer out for up to an hour (2026-09-29).
 *
 * Sized for a full 40-photo import (a sort plus a read per car), and refilled
 * one at a time, a minute apart, so a wait is at most a minute. Real AI spend
 * is capped elsewhere — the plan's AI listings per month and the unsaved-read
 * cap — so this bucket only has to stop bursts and runaway clients.
 */
export const ajDealerAi = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: arcjetMode }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 1,
      interval: 60,
      capacity: 45,
    }),
  ],
});
