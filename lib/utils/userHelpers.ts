/**
 * Helper functions for user role and membership checks
 */
import type { MemberRole } from "@/lib/generated/prisma";
import { ValidationError } from "@/lib/utils/errors";

/** A membership joined with just enough of its organization to match by slug. */
export interface MembershipWithOrgSlug {
  role: MemberRole;
  organization?: { slug: string } | null;
}

/** Any user-shaped object carrying memberships. */
export interface UserWithMemberships {
  memberships?: MembershipWithOrgSlug[] | null;
}

/**
 * A human-readable name for a user, for emails and dealer-facing lists.
 *
 * `name` is optional and `email` is nullable — Clerk supports phone-only
 * signups — so the long-standing `user.name || user.email.split("@")[0]`
 * would throw for exactly the users this fallback was meant to cover.
 */
export function displayNameFor(user: {
  name?: string | null;
  email?: string | null;
}): string {
  if (user.name?.trim()) return user.name.trim();
  const local = user.email?.split("@")[0];
  if (local) return local;
  return "Customer";
}

/**
 * The email address to bill to, or a clear refusal.
 *
 * Subscribing genuinely requires one: Stripe sends receipts, invoices and
 * dunning notices there, and Checkout wants it up front. Rather than let a
 * phone-only account reach Stripe with a null, this stops early and tells the
 * user what to do about it.
 */
export function requireBillingEmail(user: { email?: string | null }): string {
  if (!user.email) {
    throw new ValidationError(
      "Add an email address to your account before subscribing — we need somewhere to send receipts.",
      "email"
    );
  }
  return user.email;
}

/**
 * Check if user has an organization membership (any role)
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Optional organization slug to check specific org
 * @returns {boolean}
 */
export function isOrgMember(
  user: UserWithMemberships | null | undefined,
  organizationSlug: string | null = null
): boolean {
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
export function getOrgRole(
  user: UserWithMemberships | null | undefined,
  organizationSlug: string | null | undefined
): MemberRole | null {
  if (!user?.memberships || !organizationSlug) {
    return null;
  }
  
  const membership = user.memberships.find(
    m => m.organization?.slug === organizationSlug
  );
  
  return membership?.role || null;
}

/**
 * Check if user is owner of an organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {boolean}
 */
export function isOrgOwner(
  user: UserWithMemberships | null | undefined,
  organizationSlug: string | null | undefined
): boolean {
  const role = getOrgRole(user, organizationSlug);
  return role === 'OWNER';
}

/**
 * Get user's membership in a specific organization
 * @param {Object} user - User object with memberships
 * @param {string} organizationSlug - Organization slug
 * @returns {Object|null} - Membership object or null
 */
export function getOrgMembership(
  user: UserWithMemberships | null | undefined,
  organizationSlug: string | null | undefined
): MembershipWithOrgSlug | null {
  if (!user?.memberships || !organizationSlug) {
    return null;
  }
  
  return user.memberships.find(
    m => m.organization?.slug === organizationSlug
  ) || null;
}
