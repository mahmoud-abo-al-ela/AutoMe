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

// Public by design, so Arcjet (per IP) and the platform AI breaker cap it; metered but never billed to a dealer.
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
