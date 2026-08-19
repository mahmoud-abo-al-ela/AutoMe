import arcjet, { tokenBucket } from "@arcjet/next";

/**
 * Whether Arcjet is configured at all. Constructing the client with an empty
 * key makes it warn and no-op, which silently removes rate limiting — so
 * callers check this and refuse the request instead. See
 * `lib/middleware/with-rate-limit.ts`.
 */
export const arcjetConfigured = Boolean(process.env.ARCJET_KEY);

/**
 * Arcjet is only enforced in production; locally an absent key is expected and
 * requests are allowed through.
 */
export const arcjetRequired = process.env.NODE_ENV === "production";

const aj = arcjet({
  // Kept out of the constructor's way when absent: `arcjetConfigured` above is
  // what decides whether a request may proceed without a verdict.
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"], // track requests by IP address
  rules: [
    tokenBucket({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      refillRate: 10, // refill 10 tokens per interval
      interval: 3600, // per hour
      capacity: 10, // bucket maximum capacity of 10 tokens
    }),
  ],
});

export default aj;
