// Onboarding service - Business logic layer
import * as billingService from "@/lib/services/billing";
import { findUserOwnedOrganization } from "@/lib/repositories/user";

// Re-export session management functions
export {
  saveOnboardingSession,
  getOnboardingSession,
  getOnboardingSessionForUser,
  updateOnboardingSession,
  markOnboardingSessionCompleted,
  resumeOnboardingSession,
} from "./session";

/**
 * Get onboarding data for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Object containing plans and existing organization if any
 */
export async function getOnboardingData(userId) {
  const [plans, existingOwnership] = await Promise.all([
    billingService.getActivePlans(),
    findUserOwnedOrganization(userId),
  ]);

  return {
    plans,
    existingOwnership,
  };
}

/**
 * Check if user already owns an organization
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The owned organization membership or null
 */
export async function getUserOwnedOrganization(userId) {
  return findUserOwnedOrganization(userId);
}
