import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const getOrganizationBySlug = cache(async (slug) => {
  if (!slug) return null;

  return db.organization.findUnique({
    where: { slug, isActive: true },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
});

export async function getOrganization(slug) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { organization: null, membership: null };
  }

  const user = await db.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    return { organization: null, membership: null };
  }

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return { organization: null, membership: null };
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
  });

  return { organization, membership };
}

export const getOrganizationById = cache(async (id) => {
  if (!id) return null;

  return db.organization.findUnique({
    where: { id, isActive: true },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
});

export async function getCurrentOrganization() {
  const headersList = await headers();
  const slug = headersList.get("x-organization-slug");

  if (!slug) return null;

  return getOrganizationBySlug(slug);
}

export async function getImpersonationContext() {
  const headersList = await headers();

  const isActive = headersList.get("x-impersonation-active") === "true";
  if (!isActive) return null;

  return {
    organizationSlug: headersList.get("x-impersonated-org"),
    userId: headersList.get("x-impersonated-user"),
    sessionId: headersList.get("x-impersonation-session"),
  };
}

export async function getUserOrganizations(userId) {
  const memberships = await db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
    orderBy: {
      organization: { name: "asc" },
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    membershipId: m.id,
  }));
}
