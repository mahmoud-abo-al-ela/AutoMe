import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { DEALER_METERED_FEATURES } from "@/lib/middleware/plan-limits";
import { AI_FEATURES } from "@/lib/ai/features";
import { PlanLimitError, logError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";

/** How far back a new car's save looks for the calls that led to it: one working day. */
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Slack for the app and database clocks when claiming "this request's" calls. */
const CLOCK_SLACK_MS = 2_000;

/** Unsaved photo reads allowed per listing in the allowance. */
export const UNSAVED_READS_PER_LISTING = 3;

// An edit claims only calls made during that edit, or a counted car would soak up another car's photo reads.
export async function claimAiUsageForCar(
  ctx: TenantContext,
  carId: string,
  options: { requestStartedAt?: Date } = {}
): Promise<void> {
  const since = options.requestStartedAt
    ? new Date(options.requestStartedAt.getTime() - CLOCK_SLACK_MS)
    : new Date(Date.now() - CLAIM_WINDOW_MS);
  try {
    await aiUsageRepository.attributeAiUsageToCar({
      organizationId: ctx.organization.id,
      // The DB user id, as the calls were metered with (aiCallerFor) — not
      // the Clerk id.
      userId: ctx.user.id,
      carId,
      features: DEALER_METERED_FEATURES,
      since,
    });
  } catch (error) {
    logError("Claiming AI usage for a saved car failed; it goes uncounted", error);
  }
}

export async function assertUnsavedReadsLeft(ctx: TenantContext): Promise<void> {
  const limit = planFeature(await planInEffect(ctx.organization), "aiProcessing").limit ?? 0;
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
