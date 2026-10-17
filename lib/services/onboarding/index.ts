// Onboarding service - Business logic layer
import * as billingService from "@/lib/services/billing";
import { findUserOwnedOrganization } from "@/lib/repositories/user";
import { isOrganizationSlugTaken } from "@/lib/repositories/payment";
import { isValidSlug } from "@/lib/utils/slug";

// Re-export session management functions
export {
  saveOnboardingSession,
  getOnboardingSession,
  getOnboardingSessionForUser,
  updateOnboardingSession,
  markOnboardingSessionCompleted,
  resumeOnboardingSession,
} from "./session";

export async function getOnboardingData(userId: string) {
  const [plans, existingOwnership] = await Promise.all([
    billingService.getActivePlans(),
    findUserOwnedOrganization(userId),
  ]);

  return {
    plans,
    existingOwnership,
  };
}

export async function getUserOwnedOrganization(userId: string) {
  return findUserOwnedOrganization(userId);
}

export async function isSlugAvailable(slug: string) {
  if (!isValidSlug(slug)) return false;
  return !(await isOrganizationSlugTaken(slug));
}
