import * as orgRepo from "@/lib/repositories/super-admin/organization";
import * as planRepo from "@/lib/repositories/super-admin/plan";
import * as userRepo from "@/lib/repositories/super-admin/user";
import * as membershipRepo from "@/lib/repositories/super-admin/membership";
import { sendOrganizationInvitationEmail } from "./email";

/**
 * Organization service for Super Admin operations
 */

export async function createOrganization(data) {
  // Generate slug from name if not provided
  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // Check if slug already exists
  const existingOrg = await orgRepo.findOrganizationBySlug(slug);

  if (existingOrg) {
    throw new Error("An organization with this slug already exists");
  }

  // Get the plan
  const plan = await planRepo.findPlanById(data.planId);

  if (!plan) {
    throw new Error("Selected plan not found");
  }

  // Check if owner email is provided and user exists
  let existingUser = null;
  if (data.ownerEmail) {
    existingUser = await userRepo.findUserByEmail(data.ownerEmail);
  }

  // Create the organization with subscription
  const organization = await orgRepo.createOrganization({
    name: data.name,
    slug,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    website: data.website || null,
    description: data.description || null,
    isActive: true,
    // Store pending owner email if user doesn't exist yet
    pendingOwnerEmail:
      data.ownerEmail && !existingUser ? data.ownerEmail : null,
    subscription: {
      create: {
        planId: data.planId,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    },
  });

  // If owner email is provided and user exists, create membership immediately
  if (existingUser) {
    await membershipRepo.createMembership({
      userId: existingUser.id,
      organizationId: organization.id,
      role: "OWNER",
      acceptedAt: new Date(),
    });
  }

  // Send invitation email if owner email provided
  if (data.ownerEmail) {
    try {
      await sendOrganizationInvitationEmail({
        ownerEmail: data.ownerEmail,
        organizationName: data.name,
        organizationSlug: organization.slug,
        plan,
        existingUser,
      });
      console.log(`✅ Invitation email sent successfully to ${data.ownerEmail}`);
    } catch (emailError) {
      console.error("❌ Failed to send invitation email:", emailError);
      // Log detailed error for debugging
      console.error("Email error details:", {
        ownerEmail: data.ownerEmail,
        error: emailError.message,
        stack: emailError.stack,
      });
      // Don't fail the creation if email fails, but re-throw if it's a config error
      if (emailError.message.includes("EmailJS")) {
        throw new Error(
          `Organization created but email failed: ${emailError.message}`
        );
      }
    }
  }

  return { organization, plan };
}

export async function updateOrganizationStatus(orgId, isActive) {
  return orgRepo.updateOrganizationStatus(orgId, isActive);
}

export async function deleteOrganization(orgId) {
  // Get org info before deletion
  const org = await orgRepo.findOrganizationForDeletion(orgId);

  if (!org) {
    throw new Error("Organization not found");
  }

  // Delete all related data
  await orgRepo.deleteOrganizationWithRelations(orgId);

  return org;
}

export async function changeOrganizationPlan(orgId, planId) {
  const org = await orgRepo.findOrganizationWithSubscription(orgId);

  if (!org) {
    throw new Error("Organization not found");
  }

  // This will be handled by subscription service
  return { org, subscriptionId: org.subscription?.id };
}
