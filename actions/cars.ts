"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import * as carService from "@/lib/services/car";
import { coachListing, translateListing, type ListingText, type ListingToCoach } from "@/lib/services/ai";
import { reviewListing, type ListingIssueCode } from "@/lib/services/car/listing-quality";
import { aiCallerFor } from "@/lib/ai/caller";
import { refreshImageAlts } from "@/lib/services/car/image-alts";
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
  updateCarSchema,
  updateCarFullSchema,
} from "@/lib/validations/schemas";
import { enforceDealerAiLimit } from "@/lib/middleware/with-rate-limit";
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
      await enforceDealerAiLimit();
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

/**
 * Describe the car's photos once the save has answered. Platform-initiated,
 * so it is metered but never billed to the dealer (carImageAltText is not in
 * DEALER_METERED_FEATURES), and runs at low priority so it cannot take shared
 * capacity from a dealer waiting on the AI. refreshImageAlts never throws.
 */
function describePhotosAfterSave(ctx: TenantContext, carId: string) {
  const caller = { ...aiCallerFor(ctx), priority: "low" as const };
  after(() => refreshImageAlts(carId, ctx.organization.id, caller));
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
        describePhotosAfterSave(ctx, car.id);
      }

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
  // After the update, which proved the car is this dealership's. A car
  // already counted this month is claimed again, and still counts once.
  await claimAiUsageForCar(ctx, carId);
  // Also after an edit: new photos need describing, removed ones pruning.
  describePhotosAfterSave(ctx, carId);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse({ ...updatedCar, translation }, "Car updated successfully");
});

/**
 * Same gates as every dealer AI call. Not exported: it only runs inside
 * reviewListingQuality, never as its own endpoint.
 */
const coachGated = withPlanGate(
  "aiProcessing",
  withUsageLimit(
    "aiProcessing",
    async (
      ctx: TenantContext,
      listing: ListingToCoach,
      codes: ListingIssueCode[],
      language: Locale
    ) => {
      await enforceDealerAiLimit();
      return coachListing(listing, codes, language, aiCallerFor(ctx));
    }
  )
);

/**
 * Review a listing before it is published: the rule-based score and issues
 * always, plus AI advice for each issue when the plan, allowance and rate
 * limit allow. Advice is best effort — without it the dealer still gets the
 * review, and `advice` says why there is none.
 */
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
