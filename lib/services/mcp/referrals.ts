import { createMcpReferral, pruneMcpReferrals } from "@/lib/repositories/mcp/referrals";
import { logError } from "@/lib/utils/errors";

/** The links' mediums: the public tools and resources that hand out links. Anything else is ignored. */
const MEDIUMS = new Set([
  "search_cars",
  "get_car",
  "list_dealerships",
  "compare_cars",
  "resource_car",
  "resource_dealership",
]);

/** Prune about one write in this many — retention without a cron. */
const PRUNE_ONE_IN = 50;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The MCP tool a page visit came from, or null when it did not come from one. */
export function mcpReferralMedium(params: SearchParams): string | null {
  if (first(params.utm_source) !== "mcp") return null;
  const medium = first(params.utm_medium) ?? "";
  return MEDIUMS.has(medium) ? medium : null;
}

export async function recordMcpReferral(kind: "car" | "dealership", target: string, medium: string): Promise<void> {
  try {
    await createMcpReferral({ kind, target, medium });
    if (Math.random() * PRUNE_ONE_IN < 1) await pruneMcpReferrals();
  } catch (error) {
    logError("Recording an MCP referral failed; the page is unaffected", error);
  }
}
