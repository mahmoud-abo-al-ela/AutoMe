"use server";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { extractSearchFilters } from "@/lib/services/ai";
import { getCurrentOrganization } from "@/lib/getOrganization";

export const getFeaturedCars = withErrorHandling(async (limit = 4) => {
  const organization = await getCurrentOrganization();

  const result = await carRepository.findManyCars(
    {
      featured: true,
      onlyAvailable: true,
      ...(organization?.id && { organizationId: organization.id }),
    },
    { page: 1, limit }
  );

  return createSuccessResponse(result.cars);
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

  const filters = await extractSearchFilters(file, {
    organizationId: organization?.id ?? null,
    // No resolved User row on the public path, and AiUsage.userId is a foreign
    // key to User.id rather than a Clerk id — attribution stops at the org.
    userId: null,
  });

  return createSuccessResponse(filters);
});
