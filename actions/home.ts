"use server";
import { getFeaturedCars as findFeaturedCars } from "@/lib/services/car/storefront";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { extractSearchFilters, extractTextSearchFilters } from "@/lib/services/ai";
import { validateAction } from "@/lib/middleware/with-validation";
import { describedSearchSchema } from "@/lib/validations/schemas";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { publicAiCaller } from "@/lib/services/ai/authorize";
import { AI_FEATURES } from "@/lib/ai/features";

export const getFeaturedCars = withErrorHandling(async (limit: number = 4) => {
  const organization = await getCurrentOrganization();

  return createSuccessResponse(await findFeaturedCars(organization?.id ?? null, limit));
});

/**
 * Turn a buyer's photo into marketplace search filters.
 *
 * Public and unauthenticated by design — this is the home hero, and requiring a
 * session to search would be absurd. That makes it the cheapest path to the
 * shared provider key, so it carries two independent limits: Arcjet per IP, and
 * the platform breaker inside the AI client, which refuses once the whole
 * project approaches its free-tier ceiling.
 *
 * It is metered but never billed to a tenant: `searchFiltersFromImage` is
 * absent from DEALER_METERED_FEATURES, so a buyer browsing cannot consume a
 * dealer's monthly AI quota. Before this, it was not metered at all — the calls
 * simply did not exist as far as the ledger or the breaker were concerned.
 */
export const processImagesSearch = withErrorHandling(async (file: File) => {
  await enforceRateLimit();

  // Server-sourced: middleware deletes any inbound x-organization-slug before
  // setting its own, so this cannot be turned into a client-chosen tenant. Null
  // on the main marketplace, which AiUsage.organizationId permits.
  const organization = await getCurrentOrganization();

  // Billed to no one, attributed to the storefront it was made on, and at low
  // priority: an anonymous visitor must never take the capacity paying
  // dealers wait on. (It ran at standard priority before AI_FEATURE_POLICY.)
  const filters = await extractSearchFilters(
    file,
    publicAiCaller(AI_FEATURES.searchFiltersFromImage, organization?.id ?? null)
  );

  return createSuccessResponse(filters);
});

/**
 * A buyer described the car they want in the hero search ("automatic SUV under
 * 1.5 million in Nasr City"): the model turns it into listing filters plus the
 * words still to search for. Public, so validated then rate-limited before the
 * model; attribution stops at the dealership subdomain, as for the photo search.
 */
export const describeSearch = withErrorHandling(async (input: unknown) => {
  const { query } = validateAction(describedSearchSchema, input);
  await enforceRateLimit();

  const organization = await getCurrentOrganization();
  // Anonymous: billed to no one, and it yields to dealers' AI within the shared caps.
  const filters = await extractTextSearchFilters(
    query,
    publicAiCaller(AI_FEATURES.searchFiltersFromText, organization?.id ?? null)
  );

  return createSuccessResponse(filters);
});
