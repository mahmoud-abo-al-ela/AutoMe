"use server";
import { after } from "next/server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { aiCallerFor } from "@/lib/ai/caller";
import { revalidateLocalized, revalidateRouteTree } from "@/lib/utils/revalidate";
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

  // The description and address in the other language, once the save has answered: the
  // dealer does not wait on the model, and a failure only delays it.
  const caller = { ...aiCallerFor(ctx), priority: "low" as const };
  after(() => dealershipService.syncDealershipProfileText(ctx.organization.id, caller));

  revalidateLocalized(`/org/${ctx.organization.slug}/settings`);
  revalidateLocalized(`/dealerships/${ctx.organization.slug}`);
  revalidateLocalized("/dealerships");
  revalidateLocalized("/cars");
  revalidateLocalized("/");

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
  revalidateLocalized(`/org/${ctx.organization.slug}/settings`);
  revalidateLocalized(`/dealerships/${ctx.organization.slug}`);
  // Every car page shows its dealership's terms.
  revalidateRouteTree("/[locale]/(site)/cars");

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
  revalidateLocalized(`/org/${ctx.organization.slug}/settings/weekly-summary`);
  return createSuccessResponse(updated, "Email settings updated");
});

export const getDealershipInfo = withOrgAuth(async (ctx) => {
  const workingHoursData = await dealershipService.getWorkingHours(ctx.userId, ctx.organization.id);
  return createSuccessResponse(workingHoursData);
});

export const updateWorkingHours = withOrgAuth(
  async (ctx, workingHours: WorkingHourInput[]) => {
  await dealershipService.updateWorkingHours(workingHours, ctx.userId, ctx.organization.id);

  revalidateLocalized(`/org/${ctx.organization.slug}/settings`);
  // The public page shows the hours and whether the dealership is open now.
  revalidateLocalized(`/dealerships/${ctx.organization.slug}`);
  revalidateLocalized("/");

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

  revalidateLocalized(`/org/${ctx.organization.slug}/settings/team`);
  revalidateLocalized("/");

  return createSuccessResponse(null, "User role updated successfully");
});

export const deleteUser = withOrgAuth(async (ctx, targetUserId: string) => {
  await dealershipService.deleteUser(targetUserId, ctx.userId, ctx.organization.id);

  revalidateLocalized(`/org/${ctx.organization.slug}/settings/team`);

  return createSuccessResponse(null, "User deleted successfully");
});
