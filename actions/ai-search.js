"use server";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { validateAction } from "@/lib/middleware/with-validation";
import { nlSearchQuerySchema } from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import { enforceNlSearchRateLimit } from "@/lib/middleware/with-rate-limit";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { translateTextToFilters } from "@/lib/services/ai/search-query";

/**
 * Public natural-language car search.
 *
 * There is no Clerk user and no organization on the public marketplace, so the
 * usual withOrgAuth/withPlanGate/withUsageLimit stack genuinely does not apply.
 * Per server-action-guard, withErrorHandling alone is allowed for the
 * unauthenticated case — compensated here by four controls: a dedicated Arcjet
 * bucket, input validation (the 200-char cap bounds cost + injection), a
 * request-count breaker inside the service, and full metering.
 *
 * Returns filters, NOT results: the client applies them through the existing URL/
 * filter machinery, so pagination, tenant scoping, wishlist enrichment, and SSR
 * all come for free — and the resulting /cars?... link has no AI in it.
 */
export const searchCarsWithNaturalLanguage = withErrorHandling(async (rawQuery) => {
  await enforceNlSearchRateLimit(); // 1. before any work, and outside any cache (reads headers)
  const { query } = validateAction(nlSearchQuerySchema, { query: rawQuery }); // 2. bounds cost
  const organization = await getCurrentOrganization(); // 3. server-resolved, for metering only
  const result = await translateTextToFilters(query, {
    organizationId: organization?.id ?? null,
  });
  return createSuccessResponse(result);
});
