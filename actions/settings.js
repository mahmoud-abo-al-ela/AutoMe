"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse } from "@/lib/utils/response";
import { validateAction } from "@/lib/middleware/with-validation";
import { organizationProfileSchema } from "@/lib/validations/schemas";

export const getOrganizationProfile = withOrgAuth(async (ctx) => {
  const profileData = await dealershipService.getOrganizationProfile(ctx.userId, ctx.organization.id);
  return createSuccessResponse(profileData);
});

export const updateOrganizationProfile = withOrgAuth(async (ctx, payload) => {
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

export const getDealershipInfo = withOrgAuth(async (ctx) => {
  const workingHoursData = await dealershipService.getWorkingHours(ctx.userId, ctx.organization.id);
  return createSuccessResponse(workingHoursData);
});

export const updateWorkingHours = withOrgAuth(async (ctx, workingHours) => {
  await dealershipService.updateWorkingHours(workingHours, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/settings/working-hours`);
  revalidatePath("/");

  return createSuccessResponse(null, "Working hours updated successfully");
});

export const getUsers = withOrgAuth(async (ctx, search = "", page = 1, limit = 10) => {
  const result = await dealershipService.getUsers(search, { page, limit }, ctx.userId, ctx.organization.id);
  return createSuccessResponse(result);
});

export const updateUserRole = withOrgAuth(async (ctx, targetUserId, role) => {
  await dealershipService.updateUserRole(targetUserId, role, ctx.userId, ctx.organization.id);

  revalidatePath("/admin/settings/users");
  revalidatePath("/");

  return createSuccessResponse(null, "User role updated successfully");
});

export const deleteUser = withOrgAuth(async (ctx, targetUserId) => {
  await dealershipService.deleteUser(targetUserId, ctx.userId, ctx.organization.id);

  revalidatePath("/admin/settings/users");

  return createSuccessResponse(null, "User deleted successfully");
});
