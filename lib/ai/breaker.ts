import { countPlatformCallsSince } from "@/lib/repositories/ai-usage";
import { ServiceUnavailableError, logError } from "@/lib/utils/errors";


const DEFAULT_RPM = 10;
const DEFAULT_RPD = 500;

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

export function currentCaps(): BreakerCaps {
  return {
    rpm: capFromEnv("AI_MAX_REQUESTS_PER_MINUTE", DEFAULT_RPM),
    rpd: capFromEnv("AI_MAX_REQUESTS_PER_DAY", DEFAULT_RPD),
  };
}


export async function assertPlatformCapacity(): Promise<void> {
  const caps = currentCaps();
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
