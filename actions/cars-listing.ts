"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as carService from "@/lib/services/car";
import * as wishlistService from "@/lib/services/wishlist";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth } from "@/lib/middleware/with-auth";
import { ValidationError, NotFoundError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { serializeCarWithImages, type SerializedCar } from "@/lib/utils/serializers";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  carListingFiltersSchema,
  carListingInputSchema,
  carTitlesRequestSchema,
  type CarListingFiltersInput,
  type CarListingInput,
} from "@/lib/validations/schemas";

/**
 * Public: anyone may list cars. The input is validated down to what a buyer
 * can choose (carListingInputSchema) — the scope of what may be seen at all is
 * the server's to set, never the request's.
 */
export const getCars = withErrorHandling(async (input: CarListingInput) => {
  const filters = validateAction(carListingInputSchema, input);
  const { userId } = await auth();
  const organization = await getCurrentOrganization();

  // Get cars with filters
  const result = await carService.getCars(filters, {
    page: filters.page,
    limit: filters.limit,
  }, userId, organization?.id);

  // serializeCars maps a nullable serializer, but findManyCars only ever feeds
  // it real rows, so the nulls are not reachable here. Each card also carries
  // its fair-price verdict — one pooled read for the whole page.
  const [cars, wishlistIds] = await Promise.all([
    carService.withMarketPositions(result.cars as SerializedCar[]),
    userId ? wishlistService.getWishlistCarIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  result.cars = cars.map((car) => ({
    ...car,
    isWishlisted: wishlistIds.has(car.id),
  }));

  return createSuccessResponse(result);
});

export const getCarById = withErrorHandling(async (id: string) => {
  const { userId } = await auth();

  const car = await carService.getCarById(id);

  // Validate car belongs to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  if (organization && car.organizationId !== organization.id) {
    throw new NotFoundError("Car");
  }

  // Check if in wishlist
  let isWishlisted = false;
  if (userId) {
    isWishlisted = await wishlistService.isCarInUserWishlist(id, userId);
  }

  const carWithImages = serializeCarWithImages(car);

  return createSuccessResponse({
    ...carWithImages,
    isWishlisted,
  });
});

export const getCarsFilters = withErrorHandling(async (input: CarListingFiltersInput = {}) => {
  const filters = validateAction(carListingFiltersSchema, input);
  const { userId } = await auth();
  const organization = await getCurrentOrganization();
  const filterOptions = await carService.getFilterOptions(filters, userId, organization?.id);

  return createSuccessResponse({
    ...filterOptions,
    appliedFilters: filters,
  });
});

export const toggleWishlist = withAuth(async (ctx, carId: string) => {
  const result = await wishlistService.toggleWishlist(carId, ctx.userId, ctx.user);

  revalidateLocalized("/wishlist");
  revalidateLocalized("/cars");

  return createSuccessResponse(result, result.message);
});

export const getWishlist = withAuth(
  async (ctx, { page = 1, limit = 6 }: { page?: number; limit?: number } = {}) => {
  // Scope to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  const result = await wishlistService.getUserWishlist(ctx.userId, { page, limit }, organization?.id || null);

  return createSuccessResponse(result);
});

/**
 * Titles for the cars in a chat conversation list, in both languages, keyed
 * by id — one request for the whole list instead of one per conversation
 * (server actions from one tab run one at a time). Public listing fields
 * only; unknown ids are simply absent.
 */
export const getCarTitles = withErrorHandling(async (input: unknown) => {
  const carIds = validateAction(carTitlesRequestSchema, input);
  const rows = await carService.getCarTitles(carIds);
  return createSuccessResponse(Object.fromEntries(rows.map((row) => [row.id, row])));
});

/**
 * The site's live numbers (cars on sale, dealerships, cities, median price,
 * last update) — the market readout and the hero's eyebrow. Public listing
 * data only, scoped to the dealership on its subdomain.
 */
export const getMarketSummary = withErrorHandling(async () => {
  const organization = await getCurrentOrganization();
  const summary = await carService.getMarketSummary(organization?.id ?? null);
  return createSuccessResponse({
    ...summary,
    updatedAt: summary.updatedAt ? summary.updatedAt.toISOString() : null,
  });
});

export const getCarsByIds = withErrorHandling(async (carIds: string[]) => {
  if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
    throw new ValidationError("No car IDs provided", "carIds", { key: "errors.compare.noCars" });
  }

  // Scope to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  const cars = await carService.getCarsForComparison(carIds, organization?.id || null);

  if (!cars || cars.length === 0) {
    throw new ValidationError("No cars found with the provided IDs", "carIds", { key: "errors.compare.noCars" });
  }

  const carsWithImages = cars.map(serializeCarWithImages);

  return createSuccessResponse(carsWithImages);
});
