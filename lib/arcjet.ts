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
