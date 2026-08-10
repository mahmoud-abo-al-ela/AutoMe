import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import * as carRepository from "@/lib/repositories/car";
import * as teamRepository from "@/lib/repositories/team";

// Only dealer-side, entitlement-bound features consume the org's plan quota.
// Public marketplace search (searchFiltersFrom*) is metered but never billed to a
// tenant, so it is excluded here.
const DEALER_METERED_FEATURES = ["carListingFromImage"];

/**
 * One gateable resource. `planField` names the Plan column holding the limit,
 * or is null when the limit lives under `features[featureKey].limit` instead.
 */
export interface ResourceConfig {
  planField: "maxCars" | "maxMembers" | null;
  featureKey?: string;
  countQuery: (orgId: string) => Promise<number>;
  label: string;
  upgradeMessage: string;
}

export const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  cars: {
    planField: "maxCars",
    countQuery: (orgId: string) => carRepository.countCars(orgId),
    label: "cars",
    upgradeMessage: "Upgrade your plan to add more cars to your inventory.",
  },
  members: {
    planField: "maxMembers",
    countQuery: (orgId: string) => teamRepository.countMembers(orgId),
    label: "team members",
    upgradeMessage: "Upgrade your plan to invite more team members.",
  },
  aiProcessing: {
    planField: null, // uses features.aiProcessing.limit
    featureKey: "aiProcessing",
    // Real usage: successful dealer-metered AI calls this month. Replaces the old
    // proxy that counted AuditLog(action="CAR_CREATED") rows.
    countQuery: (orgId: string) =>
      aiUsageRepository.countOrgAiCallsThisMonth(orgId, DEALER_METERED_FEATURES),
    label: "AI processing requests",
    upgradeMessage: "Upgrade your plan for more AI-powered image processing.",
  },
};
