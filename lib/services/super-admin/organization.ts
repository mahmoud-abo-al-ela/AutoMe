import * as orgRepo from "@/lib/repositories/super-admin/organization";
import * as planRepo from "@/lib/repositories/super-admin/plan";
import * as userRepo from "@/lib/repositories/super-admin/user";
import * as membershipRepo from "@/lib/repositories/super-admin/membership";
import { sendOrganizationInvitationEmail } from "./email";
import { AppError, ConflictError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import {
  isValidSlug,
  slugFromName,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
} from "@/lib/utils/slug";

/**
 * Organization service for Super Admin operations
 */

export interface CreateOrganizationInput {
  name: string;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  description?: string | null;
  planId: string;
  ownerEmail?: string | null;
}

export async function createOrganization(data: CreateOrganizationInput) {
  // Suggested from the name when not given. An all-Arabic name has no Latin
  // letters to suggest from, and this used to carry on with an empty slug.
  const slug = data.slug || slugFromName(data.name);
  if (!isValidSlug(slug)) {
    throw new ValidationError(`Invalid slug: "${slug}"`, "slug", {
      key: "errors.slugInvalid",
      params: { min: SLUG_MIN_LENGTH, max: SLUG_MAX_LENGTH },
    });
  }

  // Check if slug already exists
  const existingOrg = await orgRepo.findOrganizationBySlug(slug);

  if (existingOrg) {
    throw new ConflictError("An organization with this slug already exists", {
      key: "errors.superAdmin.slugTaken",
    });
  }

  // Get the plan
  const plan = await planRepo.findPlanById(data.planId);

  if (!plan) {
    throw new NotFoundError("Plan");
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
    } catch (emailError) {
      // Don't fail the creation if email fails, but re-throw if it's a config error
      const message =
        emailError instanceof Error ? emailError.message : String(emailError);
      if (message.includes("EmailJS")) {
        // Operational, so staff see why: the org exists and only the email is missing.
        throw new AppError(`Organization created but email failed: ${message}`, 502, "EMAIL_DELIVERY_FAILED", {
          key: "errors.superAdmin.orgEmailFailed",
        });
      }
    }
  }

  return { organization, plan };
}

export async function updateOrganizationStatus(orgId: string, isActive: boolean) {
  return orgRepo.updateOrganizationStatus(orgId, isActive);
}

export async function deleteOrganization(orgId: string) {
  // Get org info before deletion
  const org = await orgRepo.findOrganizationForDeletion(orgId);

  if (!org) {
    throw new NotFoundError("Organization");
  }

  // Delete all related data
  await orgRepo.deleteOrganizationWithRelations(orgId);

  return org;
}

export async function changeOrganizationPlan(orgId: string, planId: string) {
  const org = await orgRepo.findOrganizationWithSubscription(orgId);

  if (!org) {
    throw new NotFoundError("Organization");
  }

  // This will be handled by subscription service
  return { org, subscriptionId: org.subscription?.id };
}
