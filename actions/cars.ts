"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { refuseDuringSupportSession } from "@/lib/auth/support-session";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as carService from "@/lib/services/car";
import { coachListing, translateListing, type ListingText, type ListingToCoach } from "@/lib/services/ai";
import { reviewListing, type ListingIssueCode } from "@/lib/services/car/listing-quality";
import { aiCallerFor } from "@/lib/ai/caller";
import { enqueue } from "@/lib/jobs";
import { marketPricesFor, toMarketPosition } from "@/lib/services/car/market-price";
import { claimAiUsageForCar } from "@/lib/services/car/ai-allowance";
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
import {
  carSchema,
  listingReviewSchema,
  priceComparisonSchema,
  updateCarSchema,
  updateCarFullSchema,
} from "@/lib/validations/schemas";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { authorizeDealerAiFeature } from "@/lib/services/ai/authorize";
import { AI_FEATURES } from "@/lib/ai/features";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";


export const getCarPlanLimits = withOrgAuth(async (ctx) => {
  // The plan in effect and the one feature reader — what the server will allow.
  const plan = await planInEffect(ctx.organization);
  const maxImages = plan?.maxImagesPerCar ?? 5;
  const aiProcessingEnabled = planFeature(plan, "aiProcessing").enabled;

  return createSuccessResponse({
    maxImagesPerCar: maxImages,
    aiProcessingEnabled,
  });
});

// Backward-compatible alias
export async function getMaxImagesPerCar() {
  return getCarPlanLimits();
}

// Not exported: every export of a "use server" module is a callable endpoint.
async function translateGated(ctx: TenantContext, source: ListingText, from: Locale) {
  const caller = await authorizeDealerAiFeature(ctx, AI_FEATURES.listingTranslation);
  return translateListing(source, from, caller);
}

/** Whether the save wrote the other language, for the client to say so. */
type TranslationOutcome = "none" | "done" | "skipped";

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

async function enrichAfterSave(ctx: TenantContext, carId: string) {
  const organizationId = ctx.organization.id;
  const caller = { ...aiCallerFor(ctx), priority: "low" as const };
  const queue = (job: Promise<void>, what: string) =>
    job.catch((error) => logError(`Could not queue ${what}; the next save will try again`, error));
  await Promise.all([
    queue(enqueue("image-alts", { carId, organizationId, caller }), "photo descriptions"),
    queue(enqueue("car-embedding", { carId, organizationId }), "the car's search meaning"),
  ]);
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
      if (car?.id) {
        // The photo read, translation and advice behind this car: one use.
        await claimAiUsageForCar(ctx, car.id);
        await enrichAfterSave(ctx, car.id);
      }

      revalidateLocalized(`/org/${ctx.organization.slug}/cars`);
      return createSuccessResponse({ ...car, translation }, "Car added successfully");
    }
  )
);

export const deleteCar = withOrgAuth(async (ctx, carId: string) => {
  refuseDuringSupportSession(ctx);
  await carService.deleteCar(carId, ctx.userId, ctx.organization.id);

  revalidateLocalized(`/org/${ctx.organization.slug}/cars`);
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

  revalidateLocalized(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});

export const getCarForEdit = withOrgAuth(async (ctx, carId: string) => {
  const car = await carService.getCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  // The car must belong to the dealership this request acts for. ctx already
  // proves the caller may act there (a membership, or a verified support
  // session for it); no platform role reaches past it into another dealership.
  if (car.organizationId !== ctx.organization.id) {
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
  // An edit claims only the AI calls made during it (see claimAiUsageForCar).
  const requestStartedAt = new Date();
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
  // After the update, which proved the car is this dealership's. Only this
  // edit's own calls (its translation): a car already counted this month
  // still counts once, and absorbs nothing made for another car.
  await claimAiUsageForCar(ctx, carId, { requestStartedAt });
  // Also after an edit: new photos need describing, removed ones pruning.
  await enrichAfterSave(ctx, carId);

  revalidateLocalized(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse({ ...updatedCar, translation }, "Car updated successfully");
});

/**
 * The same authorization as every dealer AI call. Not exported: it only runs
 * inside reviewListingQuality, never as its own endpoint.
 */
async function coachGated(ctx: TenantContext, listing: ListingToCoach, codes: ListingIssueCode[], language: Locale) {
  const caller = await authorizeDealerAiFeature(ctx, AI_FEATURES.listingQualityCoach);
  return coachListing(listing, codes, language, caller);
}

export const reviewListingQuality = withOrgAuth(async (ctx, input: unknown) => {
  const { language, ...listing } = validateAction(listingReviewSchema, input);
  const review = reviewListing(listing);

  let adviceByCode: Partial<Record<ListingIssueCode, string>> = {};
  let advice: "none" | "done" | "skipped" = "none";
  if (review.issues.length > 0) {
    try {
      adviceByCode = await coachGated(
        ctx,
        listing,
        review.issues.map((issue) => issue.code),
        language
      );
      advice = "done";
    } catch (error) {
      logError("Listing coach advice skipped; returning the rule-based review", error);
      advice = "skipped";
    }
  }

  return createSuccessResponse({
    score: review.score,
    advice,
    issues: review.issues.map((issue) => ({
      ...issue,
      advice: adviceByCode[issue.code] ?? null,
    })),
  });
});

export const comparePrice = withOrgAuth(async (_ctx, input: unknown) => {
  const { carId, ...car } = validateAction(priceComparisonSchema, input);
  const prices = await marketPricesFor({ id: carId ?? "", priceCurrency: "EGP", ...car });
  return createSuccessResponse(prices ? toMarketPosition(prices) : null);
});
