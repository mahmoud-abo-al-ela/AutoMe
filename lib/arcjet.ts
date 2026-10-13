import arcjet, { detectBot, fixedWindow, shield, slidingWindow, tokenBucket } from "@arcjet/next";


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
 * A dealer's AI work: the add-car photo read, the translation and the listing
 * coach. Its own client, like the buyer questions, because the shared bucket
 * above — 10 an hour, refilled all at once on the hour — could lock a dealer
 * adding several cars out for up to an hour (2026-09-29).
 *
 * Refilled one at a time, a minute apart, so a wait is at most a minute. Real AI spend
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

/**
 * Chat translations: a member taps "Translate" on a message. Free to everyone
 * (owner's decision, 2026-09-29), so this bucket and the provider caps are the
 * only limits on it. Keyed on the signed-in user, not the IP, so a showroom's
 * shared Wi-Fi does not share one allowance. Sized for reading back through a
 * long conversation, refilled one a minute.
 */
export const ajChatTranslation = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["userId"],
  rules: [
    shield({ mode: arcjetMode }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 1,
      interval: 60,
      capacity: 40,
    }),
  ],
});

/**
 * Search suggestions, asked for as a buyer types — a request per pause, of a
 * public, shared answer most often served by the CDN. Its own client, so
 * typing cannot spend the shared bucket uploads and payments rely on.
 * Generous for a person, refilled continuously; it stops scripts.
 */
export const ajSearchSuggest = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: arcjetMode }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 20,
      interval: 10,
      capacity: 60,
    }),
  ],
});

/** A positive whole number from the environment, or the default. */
function limitFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/**
 * The public MCP endpoint (app/api/mcp). Its own client, so AI traffic never
 * spends a buyer's bucket. Every value is provisional — tuned from the pilot's
 * load test and data — and overridable without a code change (MCP_RL_*, then
 * a redeploy: Vercel applies an environment change only to new deployments).
 *
 * No bot detection: MCP clients are programs by definition, and Arcjet's bot
 * rule errors on a request with no User-Agent — which this endpoint then
 * refused as "unavailable". The limits are what stop a crawler; the measures
 * record each client's name. The fixed window keyed on one constant is a ceiling
 * across all callers together, which protects the database from a spread-out
 * burst that no per-IP bucket sees.
 */
export const ajMcpPublic = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: arcjetMode }),
    tokenBucket({
      mode: "LIVE",
      refillRate: limitFromEnv("MCP_RL_IP_REFILL", 30),
      interval: 60,
      capacity: limitFromEnv("MCP_RL_IP_CAPACITY", 60),
    }),
    fixedWindow({
      mode: "LIVE",
      characteristics: ["mcpScope"],
      window: "60s",
      max: limitFromEnv("MCP_RL_GLOBAL_PER_MINUTE", 1200),
    }),
  ],
});

/**
 * The costly calls on top of the above, per IP: free-text search, deep pages,
 * comparisons. A conversation makes a handful; a walk through the catalogue
 * makes hundreds.
 */
export const ajMcpCostly = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    slidingWindow({
      mode: "LIVE",
      interval: "1h",
      max: limitFromEnv("MCP_RL_COSTLY_PER_HOUR", 120),
    }),
  ],
});

/**
 * The signed-in MCP endpoint (app/api/mcp/account), per AutoMe user — the
 * token's account, whatever address it calls from. A conversation reads a
 * few lists; this is room for that and nothing like a sweep. Provisional,
 * overridable like the public limits (MCP_ACCOUNT_RL_*, then a redeploy).
 */
export const ajMcpAccount = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["userId"],
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: limitFromEnv("MCP_ACCOUNT_RL_REFILL", 20),
      interval: 60,
      capacity: limitFromEnv("MCP_ACCOUNT_RL_CAPACITY", 40),
    }),
  ],
});

/**
 * Test-drive requests and cancellations through the signed-in MCP endpoint,
 * per AutoMe user and per kind: a handful a day is a person planning visits;
 * more is a model looping, or acting on text it should not have obeyed.
 * Each request notifies a real dealership. MCP_ACCOUNT_RL_TEST_DRIVES_PER_DAY.
 */
export const ajMcpAccountTestDrives = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["userId", "mcpAction"],
  rules: [
    slidingWindow({
      mode: "LIVE",
      interval: "24h",
      max: limitFromEnv("MCP_ACCOUNT_RL_TEST_DRIVES_PER_DAY", 3),
    }),
  ],
});
