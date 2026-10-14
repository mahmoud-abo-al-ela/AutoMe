import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import * as carRepository from "@/lib/repositories/car";
import * as teamRepository from "@/lib/repositories/team";
import { DEALER_BILLED_FEATURES } from "@/lib/ai/features";

// The features a dealer's monthly allowance counts: those AI_FEATURE_POLICY
// marks billedToDealer (photo reads, listing translation, the listing coach).
// Public search, buyer answers and platform housekeeping are metered, never
// billed to a dealership.
export const DEALER_METERED_FEATURES: string[] = DEALER_BILLED_FEATURES;

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
    // Cars saved with AI's help this month — plans sell "AI listings", so one
    // car's photo read, translation and coach advice are one use together.
    // Calls are tied to a car on save; see lib/services/car/ai-allowance.ts.
    countQuery: (orgId: string) =>
      aiUsageRepository.countOrgAiCarsThisMonth(orgId, DEALER_METERED_FEATURES),
    label: "AI listings",
    upgradeMessage: "Upgrade your plan for more AI-powered image processing.",
  },
};
