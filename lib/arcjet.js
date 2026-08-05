import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
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

// Dedicated bucket for public natural-language search. Keeping it separate from
// the shared `aj` above means abuse of the costly AI endpoint can't drain the
// bucket that gates dealer flows (car creation, image search) — and vice versa.
// Per-IP, tuned for human browsing (~10/min) rather than scraping.
export const ajNlSearch = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // 10 tokens
      interval: 60, //   per minute
      capacity: 10, //   burst up to 10
    }),
  ],
});
