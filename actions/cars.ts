"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import * as carService from "@/lib/services/car";
import { translateListing, type ListingText } from "@/lib/services/ai";
import { aiCallerFor } from "@/lib/ai/caller";
import {
  applyTranslation,
  sourceText,
  translationSource,
  type BilingualListing,
} from "@/lib/services/car/bilingual";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError, AuthorizationError, logError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";
import type { Locale } from "@/i18n/routing";
import { validateAction } from "@/lib/middleware/with-validation";
import { carSchema, updateCarSchema, updateCarFullSchema } from "@/lib/validations/schemas";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";


/*
 * Photo extraction moved to the streaming route app/api/ai/car-listing, which
 * reports real progress. The server action it replaces is gone rather than kept
 * beside it: every export of a "use server" module is a callable endpoint, and a
 * second, unstreamed path to the same gated call is one more to keep guarded.
 */

export const getCarPlanLimits = withOrgAuth(async (ctx) => {
  const plan = ctx.organization.subscription?.plan;
  const maxImages = plan?.maxImagesPerCar ?? 5;
  // Plan.features is free-form JSON; narrow before reading the AI entitlement.
  const features = (plan?.features ?? {}) as {
    aiProcessing?: { enabled?: boolean };
  };
  const aiProcessingEnabled = features.aiProcessing?.enabled ?? false;

  return createSuccessResponse({
    maxImagesPerCar: maxImages,
    aiProcessingEnabled,
  });
});

// Backward-compatible alias
export async function getMaxImagesPerCar() {
  return getCarPlanLimits();
}

/**
 * The same gates as the photo extraction: AI on the plan, quota left, rate
 * limit. Deliberately NOT exported — every export of a "use server" module is a
 * callable endpoint, and this one must only run inside a save.
 */
const translateGated = withPlanGate(
  "aiProcessing",
  withUsageLimit(
    "aiProcessing",
    async (ctx: TenantContext, source: ListingText, from: Locale) => {
      await enforceRateLimit();
      return translateListing(source, from, aiCallerFor(ctx));
    }
  )
);

/** Whether the save wrote the other language, for the client to say so. */
type TranslationOutcome = "none" | "done" | "skipped";

/**
 * Write the language the dealer did not, before the car is saved.
 *
 * Best effort by design: a plan without AI, a used-up allowance, a rate limit
 * or a failed call all save the car as the dealer wrote it. The listing then
 * shows its one language to both audiences, with the "not translated" note —
 * which beats refusing to save a car over a translation.
 */
async function fillOtherLanguage<T extends BilingualListing>(
  ctx: TenantContext,
  car: T,
  editedLocale: Locale | null
): Promise<{ car: T; translation: TranslationOutcome }> {
  const from = translationSource(car, editedLocale);
  if (!from) return { car, translation: "none" };

  try {
    const translated = await translateGated(ctx, sourceText(car, from), from);
    const to: Locale = from === "en" ? "ar" : "en";
    return {
      car: applyTranslation(car, to, translated, editedLocale === from),
      translation: "done",
    };
  } catch (error) {
    logError("Listing translation skipped; saving the car without it", error);
    return { car, translation: "skipped" };
  }
}

/** Client input: only the two known locales mean anything. */
function toEditedLocale(value: unknown): Locale | null {
  return value === "en" || value === "ar" ? value : null;
}

export const addCar = withOrgAuth(
  withUsageLimit(
    "cars",
    async (
      ctx,
      payload: { data?: unknown } & Record<string, unknown>,
      options?: { editedLocale?: unknown }
    ) => {
      const rawData = payload.data || payload;
      const validated = validateAction(carSchema, rawData);
      const { car: carData, translation } = await fillOtherLanguage(
        ctx,
        validated,
        toEditedLocale(options?.editedLocale)
      );
      const car = await carService.createCar(carData, ctx.userId, ctx.organization.id);

      revalidatePath(`/org/${ctx.organization.slug}/cars`);
      return createSuccessResponse({ ...car, translation }, "Car added successfully");
    }
  )
);

export const getCars = withOrgAuth(
  async (
    ctx,
    search: string = "",
    status: string = "all",
    page: number = 1,
    limit: number = 10
  ) => {
  const filters = {
    search: search || undefined,
    status: status === "all" ? undefined : status.toUpperCase(),
    onlyAvailable: false,
  };

  const result = await carService.getCars(filters, { page, limit }, ctx.userId, ctx.organization.id);

  return createSuccessResponse({
    data: result.cars,
    pagination: result.pagination,
  });
});

export const deleteCar = withOrgAuth(async (ctx, carId: string) => {
  await carService.deleteCar(carId, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(null, "Car deleted successfully");
});

export const updateCar = withOrgAuth(
  async (
    ctx,
    carId: string,
    { status, featured }: { status?: string; featured?: boolean }
  ) => {
  const updateData: { status?: string; featured?: boolean } = {};
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

  const validatedUpdate = validateAction(updateCarSchema, updateData);

  const updatedCar = await carService.updateCar(carId, validatedUpdate, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});

export const getCarForEdit = withOrgAuth(async (ctx, carId: string) => {
  const car = await carService.getCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  // Verify car belongs to user's organization
  // Platform admins (UserRole.ADMIN) may reach across orgs for support; regular
  // members may not. `ctx.role` never existed, and MemberRole has no ADMIN value,
  // so the escape hatch has to read the platform role off ctx.user.
  if (car.organizationId !== ctx.organization.id && ctx.user?.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }
  return createSuccessResponse(car);
});

export const updateCarFull = withOrgAuth(
  async (
    ctx,
    carId: string,
    payload: { data?: unknown } & Record<string, unknown>,
    options?: { editedLocale?: unknown }
  ) => {
  const rawData = payload.data || payload;
  const validated = validateAction(updateCarFullSchema, rawData);
  const { car: carData, translation } = await fillOtherLanguage(
    ctx,
    validated,
    toEditedLocale(options?.editedLocale)
  );

  const updatedCar = await carService.updateCarFull(
    carId,
    carData,
    ctx.userId,
    ctx.organization.id
  );

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse({ ...updatedCar, translation }, "Car updated successfully");
});
