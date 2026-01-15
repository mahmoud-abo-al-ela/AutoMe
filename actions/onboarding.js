"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { auditHelpers } from "@/lib/services/audit/audit";

export async function checkSlugAvailability(slug) {
  try {
    if (!slug || slug.length < 3) {
      return { available: false };
    }

    const existing = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    return { available: !existing };
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return { available: false };
  }
}

export async function createOrganization({
  name,
  slug,
  email,
  phone,
  address,
  planId,
  workingHours,
  userId,
}) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate slug availability
    const { available } = await checkSlugAvailability(slug);
    if (!available) {
      return { success: false, error: "This URL slug is already taken" };
    }

    // Get the plan
    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, error: "Invalid plan selected" };
    }

    // Create organization with related data in a transaction
    const organization = await db.$transaction(async (tx) => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          email,
          phone: phone || null,
          address: address || null,
          workingHours,
        },
      });

      // Create owner membership
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      // Create subscription
      const now = new Date();
      const trialEnd =
        plan.trialDays > 0
          ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
          : null;

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          status: trialEnd ? "TRIALING" : "ACTIVE",
          trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return org;
    });

    // Log the organization creation
    await auditHelpers.logOrgCreated(organization, user.id, user.email);

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "Failed to create organization" };
  }
}
