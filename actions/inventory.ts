"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { validateAction } from "@/lib/middleware/with-validation";
import { bulkCarUpdateSchema, inventorySchema } from "@/lib/validations/schemas";
import * as dashboardService from "@/lib/services/dashboard";
import * as carService from "@/lib/services/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { revalidateLocalized } from "@/lib/utils/revalidate";

/** One page of the dealer's Cars table (view, search, filters, sort, page). */
export const getInventory = withOrgAuth(async (ctx, input: unknown) => {
  const query = validateAction(inventorySchema, input);
  return createSuccessResponse(await dashboardService.getInventory(ctx.userId, ctx.organization.id, query));
});

/** Every car the table currently shows, for its CSV. */
export const exportInventory = withOrgAuth(async (ctx, input: unknown) => {
  const query = validateAction(inventorySchema, input);
  return createSuccessResponse(await dashboardService.exportInventory(ctx.userId, ctx.organization.id, query));
});

/** How many cars are in each status, for the views above the table. */
export const getInventoryCounts = withOrgAuth(async (ctx) => {
  return createSuccessResponse(await dashboardService.getInventoryCounts(ctx.userId, ctx.organization.id));
});

/**
 * Mark the selected cars as sold, hide them, put them back on sale, or
 * feature them. Revalidates the Cars page, so the views' counts follow.
 */
export const updateCars = withOrgAuth(async (ctx, input: unknown) => {
  const { carIds, ...updates } = validateAction(bulkCarUpdateSchema, input);
  const count = await carService.updateCars(carIds, updates, ctx.userId, ctx.organization.id);

  revalidateLocalized(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse({ count });
});
