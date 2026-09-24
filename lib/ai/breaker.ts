import { countPlatformCallsSince } from "@/lib/repositories/ai-usage";
import { ServiceUnavailableError, logError } from "@/lib/utils/errors";


const DEFAULT_RPM = 10;
const DEFAULT_RPD = 500;

/**
 * The caps are one pool shared by every tenant. Without a reserve, a burst of
 * free-plan usage would leave paying dealers facing "AI busy", so low-priority
 * calls stop at this percentage of each cap and standard calls may use all of it.
 */
const DEFAULT_LOW_PRIORITY_PERCENT = 60;

/** "low" is for callers not paying for the capacity they use: free-plan dealers. */
export type CapacityPriority = "standard" | "low";

function capFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  // A malformed cap must not silently disable the breaker.
  if (!Number.isFinite(parsed) || parsed < 0) {
    logError(`${name} is not a non-negative integer; using default ${fallback}`);
    return fallback;
  }
  return parsed;
}

export interface BreakerCaps {
  rpm: number;
  rpd: number;
}

export function currentCaps(priority: CapacityPriority = "standard"): BreakerCaps {
  const caps = {
    rpm: capFromEnv("AI_MAX_REQUESTS_PER_MINUTE", DEFAULT_RPM),
    rpd: capFromEnv("AI_MAX_REQUESTS_PER_DAY", DEFAULT_RPD),
  };
  if (priority === "standard") return caps;

  // Above 100 would let low priority spend the reserve it exists to protect.
  const percent = Math.min(
    capFromEnv("AI_LOW_PRIORITY_CAP_PERCENT", DEFAULT_LOW_PRIORITY_PERCENT),
    100
  );
  return {
    rpm: Math.floor((caps.rpm * percent) / 100),
    rpd: Math.floor((caps.rpd * percent) / 100),
  };
}


export async function assertPlatformCapacity(
  priority: CapacityPriority = "standard"
): Promise<void> {
  const caps = currentCaps(priority);
  const now = Date.now();

  let minuteCount: number;
  let dayCount: number;

  try {
    [minuteCount, dayCount] = await Promise.all([
      countPlatformCallsSince(new Date(now - 60_000)),
      countPlatformCallsSince(new Date(now - 24 * 60 * 60_000)),
    ]);
  } catch (error) {
    logError("AI breaker could not read the usage ledger; allowing the call", error);
    return;
  }

  if (minuteCount >= caps.rpm || dayCount >= caps.rpd) {
    // The message is developer-facing; the client renders `messageKey`.
    throw new ServiceUnavailableError(
      `AI capacity reached (${minuteCount}/${caps.rpm} per minute, ${dayCount}/${caps.rpd} per day)`,
      { key: "errors.ai.busy" }
    );
  }
}
