import { Redis } from "@upstash/redis";

export function readOnlyRedis(env: Record<string, string | undefined>): Redis | null {
  const url = env.OPS_MCP_REDIS_REST_URL;
  const token = env.OPS_MCP_REDIS_READ_ONLY_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, retry: false, signal: () => AbortSignal.timeout(2_000) });
}
