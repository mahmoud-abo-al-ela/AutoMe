import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import * as carRepository from "@/lib/repositories/car";
import * as teamRepository from "@/lib/repositories/team";

// Only dealer-side, entitlement-bound features consume the org's plan quota.
// Public marketplace search (searchFiltersFrom*) is metered but never billed to a
// tenant, so it is excluded here.
const DEALER_METERED_FEATURES = ["carListingFromImage"];

export const RESOURCE_CONFIG = {
  cars: {
    planField: "maxCars",
    countQuery: (orgId) => carRepository.countCars(orgId),
    label: "cars",
    upgradeMessage: "Upgrade your plan to add more cars to your inventory.",
  },
  members: {
    planField: "maxMembers",
    countQuery: (orgId) => teamRepository.countMembers(orgId),
    label: "team members",
    upgradeMessage: "Upgrade your plan to invite more team members.",
  },
  aiProcessing: {
    planField: null, // uses features.aiProcessing.limit
    featureKey: "aiProcessing",
    // Real usage: successful dealer-metered AI calls this month. Replaces the old
    // proxy that counted AuditLog(action="CAR_CREATED") rows.
    countQuery: (orgId) =>
      aiUsageRepository.countOrgAiCallsThisMonth(orgId, DEALER_METERED_FEATURES),
    label: "AI processing requests",
    upgradeMessage: "Upgrade your plan for more AI-powered image processing.",
  },
};
