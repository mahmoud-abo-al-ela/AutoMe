/**
 * Helper functions for user role and membership checks
 */

/**
 * Check if user has an organization membership (any role)
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Optional organization slug to check specific org
 * @returns {boolean}
 */
export function isOrgMember(user, organizationSlug = null) {
  if (!user?.memberships || user.memberships.length === 0) {
    return false;
  }
  
  if (organizationSlug) {
    return user.memberships.some(
      m => m.organization?.slug === organizationSlug
    );
  }
  
  return true;
}

/**
 * Get user's role in a specific organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {string|null} - Returns 'OWNER', 'ADMIN', 'MEMBER', or null
 */
export function getOrgRole(user, organizationSlug) {
  if (!user?.memberships || !organizationSlug) {
    return null;
  }
  
  const membership = user.memberships.find(
    m => m.organization?.slug === organizationSlug
  );
  
  return membership?.role || null;
}

/**
 * Check if user is owner or admin of an organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {boolean}
 */
export function canManageOrg(user, organizationSlug) {
  const role = getOrgRole(user, organizationSlug);
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if user is owner of an organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {boolean}
 */
export function isOrgOwner(user, organizationSlug) {
  const role = getOrgRole(user, organizationSlug);
  return role === 'OWNER';
}

/**
 * Get user's membership in a specific organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {Object|null} - Membership object or null
 */
export function getOrgMembership(user, organizationSlug) {
  if (!user?.memberships || !organizationSlug) {
    return null;
  }
  
  return user.memberships.find(
    m => m.organization?.slug === organizationSlug
  ) || null;
}
