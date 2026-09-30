"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse } from "@/lib/utils/response";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  dealershipTermsSchema,
  emailPreferencesSchema,
  organizationProfileSchema,
} from "@/lib/validations/schemas";
import type { UserRole } from "@/lib/generated/prisma";
import type { WorkingHourInput } from "@/lib/repositories/dealership/working-hours";

export const getOrganizationProfile = withOrgAuth(async (ctx) => {
  const profileData = await dealershipService.getOrganizationProfile(ctx.userId, ctx.organization.id);
  return createSuccessResponse(profileData);
});

export const updateOrganizationProfile = withOrgAuth(async (ctx, payload: unknown) => {
  const profileData = validateAction(organizationProfileSchema, payload);
  const updatedProfile = await dealershipService.updateOrganizationProfile(
    profileData,
    ctx.userId,
    ctx.organization.id
  );

  revalidatePath(`/org/${ctx.organization.slug}/settings/profile`);
  revalidatePath(`/dealerships/${ctx.organization.slug}`);
  revalidatePath("/dealerships");
  revalidatePath("/cars");
  revalidatePath("/");

  return createSuccessResponse(updatedProfile, "Organization profile updated successfully");
});

export const getDealershipTerms = withOrgAuth(async (ctx) => {
  const terms = await dealershipService.getDealershipTerms(ctx.userId, ctx.organization.id);
  return createSuccessResponse(terms);
});

export const updateDealershipTerms = withOrgAuth(async (ctx, payload: unknown) => {
  const terms = validateAction(dealershipTermsSchema, payload);
  const updated = await dealershipService.updateDealershipTerms(
    terms,
    ctx.userId,
    ctx.organization.id
  );

  // Shown on every one of the dealership's listings, and cited by the assistant.
  revalidatePath(`/org/${ctx.organization.slug}/settings/terms`);
  revalidatePath(`/dealerships/${ctx.organization.slug}`);
  revalidatePath("/cars", "layout");

  return createSuccessResponse(updated, "Dealership terms updated");
});

export const getEmailPreferences = withOrgAuth(async (ctx) => {
  const preferences = await dealershipService.getEmailPreferences(ctx.userId, ctx.organization.id);
  return createSuccessResponse(preferences);
});

export const updateEmailPreferences = withOrgAuth(async (ctx, payload: unknown) => {
  const preferences = validateAction(emailPreferencesSchema, payload);
  const updated = await dealershipService.updateEmailPreferences(
    preferences,
    ctx.userId,
    ctx.organization.id
  );
  revalidatePath(`/org/${ctx.organization.slug}/settings/weekly-summary`);
  return createSuccessResponse(updated, "Email settings updated");
});

export const getDealershipInfo = withOrgAuth(async (ctx) => {
  const workingHoursData = await dealershipService.getWorkingHours(ctx.userId, ctx.organization.id);
  return createSuccessResponse(workingHoursData);
});

export const updateWorkingHours = withOrgAuth(
  async (ctx, workingHours: WorkingHourInput[]) => {
  await dealershipService.updateWorkingHours(workingHours, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/settings/working-hours`);
  revalidatePath("/");

  return createSuccessResponse(null, "Working hours updated successfully");
});

export const getUsers = withOrgAuth(
  async (ctx, search: string = "", page: number = 1, limit: number = 10) => {
  const result = await dealershipService.getUsers(search, { page, limit }, ctx.userId, ctx.organization.id);
  return createSuccessResponse(result);
});

export const updateUserRole = withOrgAuth(
  async (ctx, targetUserId: string, role: UserRole) => {
  await dealershipService.updateUserRole(targetUserId, role, ctx.userId, ctx.organization.id);

  revalidatePath("/admin/settings/users");
  revalidatePath("/");

  return createSuccessResponse(null, "User role updated successfully");
});

export const deleteUser = withOrgAuth(async (ctx, targetUserId: string) => {
  await dealershipService.deleteUser(targetUserId, ctx.userId, ctx.organization.id);

  revalidatePath("/admin/settings/users");

  return createSuccessResponse(null, "User deleted successfully");
});
