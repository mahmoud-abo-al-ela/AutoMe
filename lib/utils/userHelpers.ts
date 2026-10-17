/**
 * Helper functions for user role and membership checks
 */
import type { MemberRole } from "@/lib/generated/prisma";

/** A membership joined with just enough of its organization to match by slug. */
export interface MembershipWithOrgSlug {
  role: MemberRole;
  organization?: { slug: string } | null;
}

/** Any user-shaped object carrying memberships. */
export interface UserWithMemberships {
  memberships?: MembershipWithOrgSlug[] | null;
}

export function displayNameFor(user: {
  name?: string | null;
  email?: string | null;
}): string {
  if (user.name?.trim()) return user.name.trim();
  const local = user.email?.split("@")[0];
  if (local) return local;
  return "Customer";
}


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

export function isOrgOwner(
  user: UserWithMemberships | null | undefined,
  organizationSlug: string | null | undefined
): boolean {
  const role = getOrgRole(user, organizationSlug);
  return role === 'OWNER';
}

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
