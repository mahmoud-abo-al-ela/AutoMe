import { headers } from "next/headers";
import { cache } from "react";
import * as tenantRepository from "@/lib/repositories/tenant";
import { auth } from "@clerk/nextjs/server";

export const getOrganizationBySlug = cache(async (slug: string | null | undefined) => {
  if (!slug) return null;

  return tenantRepository.findActiveOrganizationBySlug(slug);
});

export async function getOrganization(slug: string) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { organization: null, membership: null };
  }

  const user = await tenantRepository.findUserRowByClerkId(clerkId);

  if (!user) {
    return { organization: null, membership: null };
  }

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return { organization: null, membership: null };
  }

  const membership = await tenantRepository.findMembershipRow(user.id, organization.id);

  return { organization, membership };
}

export const getOrganizationById = cache(async (id: string | null | undefined) => {
  if (!id) return null;

  return tenantRepository.findActiveOrganizationById(id);
});

export async function getCurrentOrganization() {
  const headersList = await headers();
  const slug = headersList.get("x-organization-slug");

  if (!slug) return null;

  return getOrganizationBySlug(slug);
}

export async function getDashboardOrganizationSlug() {
  const headersList = await headers();
  return headersList.get("x-dashboard-org");
}

export async function getUserOrganizations(userId: string) {
  const memberships = await tenantRepository.findMembershipsWithOrganizations(userId);

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    membershipId: m.id,
  }));
}
