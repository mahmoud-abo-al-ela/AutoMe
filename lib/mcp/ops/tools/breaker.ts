import { z } from "zod";
import { breakerSnapshot } from "@/lib/ai/breaker-snapshot";
import type { OpsTool } from "../tool";

export const breakerStatusTool: OpsTool<Record<string, never>, Record<string, z.ZodTypeAny>> = {
  name: "get_breaker_status",
  title: "AI capacity breaker status",
  description:
    "Each AI provider key's caps, what it has used this minute, day and month, and whether it would refuse " +
    "a call right now at standard and at low priority. Reads only: never changes a counter.",
  inputSchema: {},
  outputSchema: {
    source: z.enum(["redis", "ledger"]).describe("ledger when the server has no read-only Redis token"),
    keys: z.array(
      z.object({
        ledger: z.string(),
        provider: z.string(),
        keyIndex: z.number(),
        pool: z.string().optional(),
        caps: z.object({ rpm: z.number(), rpd: z.number().optional(), monthlyTokens: z.number().optional() }),
        usage: z.object({ minute: z.number(), day: z.number(), tokens: z.number() }),
        source: z.enum(["redis", "ledger"]),
        blocked: z.object({ standard: z.string().nullable(), low: z.string().nullable() }),
      })
    ),
  },
  run: async (_, config) => ({
    source: config.redis ? "redis" : "ledger",
    keys: await breakerSnapshot(config.redis),
  }),
};
