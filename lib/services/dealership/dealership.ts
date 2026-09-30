// Dealership service functions
import * as workingHoursRepository from "@/lib/repositories/dealership/working-hours";
import * as dealershipRepository from "@/lib/repositories/dealership";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";
import type {
  DealershipTermsInput,
  EmailPreferencesInput,
  OrganizationProfileInput,
} from "@/lib/validations/schemas";
import type { WorkingHourInput } from "@/lib/repositories/dealership/working-hours";

async function getAuthorizedUser(
  userId: string,
  organizationId: string,
  ownerOnly = false
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const hasAccess = user.memberships?.some((membership) => {
    if (membership.organizationId !== organizationId) return false;
    return ownerOnly ? membership.role === "OWNER" : true;
  });

  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError(
      ownerOnly
        ? "Only organization owners can update organization profile"
        : "You don't have access to this organization"
    );
  }

  return user;
}

/**
 * Get organization profile for settings
 */
export async function getOrganizationProfile(userId: string, organizationId: string) {
  await getAuthorizedUser(userId, organizationId);
  const profile = await dealershipRepository.findOrganizationProfile(organizationId);
  return { profile };
}

/**
 * Update organization profile for settings
 */
export async function updateOrganizationProfile(
  profileData: OrganizationProfileInput,
  userId: string,
  organizationId: string
) {
  await getAuthorizedUser(userId, organizationId, true);
  return dealershipRepository.updateOrganizationProfile(organizationId, profileData);
}

/**
 * The dealership terms buyers see on every listing. Any member may read them;
 * only an owner may change them, as with the profile they sit beside.
 */
export async function getDealershipTerms(userId: string, organizationId: string) {
  await getAuthorizedUser(userId, organizationId);
  return dealershipRepository.findDealershipTerms(organizationId);
}

/** Any member may see what the dealership receives by email. */
export async function getEmailPreferences(userId: string, organizationId: string) {
  await getAuthorizedUser(userId, organizationId);
  return dealershipRepository.findEmailPreferences(organizationId);
}

/** Only an owner changes it — the weekly summary goes to the owners. */
export async function updateEmailPreferences(
  preferences: EmailPreferencesInput,
  userId: string,
  organizationId: string
) {
  await getAuthorizedUser(userId, organizationId, true);
  return dealershipRepository.updateEmailPreferences(organizationId, preferences);
}

export async function updateDealershipTerms(
  terms: DealershipTermsInput,
  userId: string,
  organizationId: string
) {
  await getAuthorizedUser(userId, organizationId, true);
  return dealershipRepository.updateDealershipTerms(organizationId, {
    ...terms,
    // A note only means something beside "offers financing: yes".
    financingNote: terms.offersFinancing ? terms.financingNote || null : null,
  });
}

/**
 * Get working hours for an organization
 */
export async function getWorkingHours(userId: string, organizationId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  const workingHours = await workingHoursRepository.findWorkingHours(organizationId);

  return { workingHours };
}

/**
 * Update working hours for an organization
 */
export async function updateWorkingHours(
  workingHours: WorkingHourInput[],
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("Only organization owners can update working hours");
  }

  await workingHoursRepository.updateWorkingHours(organizationId, workingHours);
}
