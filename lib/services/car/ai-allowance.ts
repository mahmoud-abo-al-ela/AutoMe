import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { DEALER_METERED_FEATURES } from "@/lib/middleware/plan-limits";
import { AI_FEATURES } from "@/lib/ai/features";
import { PlanLimitError, logError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

/**
 * A plan's AI allowance counts cars, not calls (the owner's decision,
 * 2026-09-28): pricing sells "N AI listings per month", so the photo read,
 * the translation and the coach advice behind one saved car are one use.
 *
 * Calls are metered as they happen, unclaimed; saving a car claims them.
 * That leaves photo reads the dealer never saves free — so they get a cap of
 * their own, a multiple of the allowance, or one dealer could read photos
 * without end on the shared provider capacity.
 */

/** How far back a save looks for the calls that led to it: one working day. */
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Unsaved photo reads allowed per listing in the allowance. */
export const UNSAVED_READS_PER_LISTING = 3;

/**
 * Tie the calls that led to this car to it, so they count as one use. Never
 * throws: the car is already saved, and a lost claim only means the dealer
 * was not charged for it.
 */
export async function claimAiUsageForCar(ctx: TenantContext, carId: string): Promise<void> {
  try {
    await aiUsageRepository.attributeAiUsageToCar({
      organizationId: ctx.organization.id,
      // The DB user id, as the calls were metered with (aiCallerFor) — not
      // the Clerk id.
      userId: ctx.user.id,
      carId,
      features: DEALER_METERED_FEATURES,
      since: new Date(Date.now() - CLAIM_WINDOW_MS),
    });
  } catch (error) {
    logError("Claiming AI usage for a saved car failed; it goes uncounted", error);
  }
}

/**
 * Refuse a photo read once this month's unsaved ones reach the cap. Runs after
 * withPlanGate/withUsageLimit, which already refused a plan without AI or
 * with its listings used up.
 */
export async function assertUnsavedReadsLeft(ctx: TenantContext): Promise<void> {
  const features = (ctx.organization.subscription?.plan?.features ?? {}) as Record<string, unknown>;
  const limit = (features.aiProcessing as { limit?: number } | undefined)?.limit ?? 0;
  if (limit === -1) return;

  const cap = Math.max(limit, 1) * UNSAVED_READS_PER_LISTING;
  const unsaved = await aiUsageRepository.countOrgUnsavedAiCallsThisMonth(
    ctx.organization.id,
    AI_FEATURES.carListingFromImage
  );
  if (unsaved >= cap) {
    throw new PlanLimitError({
      resource: "aiProcessing",
      limit: cap,
      currentUsage: unsaved,
      upgradeUrl: `/org/${ctx.organization.slug}/billing`,
      message: "Too many photo reads this month were never saved as a car.",
      i18n: { key: "errors.ai.unsavedReads", params: { cap } },
    });
  }
}
