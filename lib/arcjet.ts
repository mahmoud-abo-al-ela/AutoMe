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

export const ajSearchMeaning = arcjet({
  key: process.env.ARCJET_KEY ?? "",
  characteristics: ["ip.src"],
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 30,
      interval: 3600,
      capacity: 30,
    }),
  ],
});

/** A positive whole number from the environment, or the default. */
function limitFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

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
