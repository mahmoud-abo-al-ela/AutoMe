import { z } from "zod";
import { MAX_COMPARE_CARS } from "@/lib/utils";

/**
 * The public cars listing's input (getCars, getCarsFilters): only what a
 * buyer can choose. Anything else a request carries is dropped — above all
 * the scope: `organizationId`, `status` and `onlyAvailable` decide which cars
 * may be seen at all, and from the client they would list another dealer's
 * hidden and sold cars. The server sets the scope (the storefront's dealership
 * on a subdomain; public listings everywhere else), and the search's meaning
 * is computed there too.
 */

const word = z.string().trim().max(60);
/** A multi-select: one value or several, as the URL and the filter panel send it. */
const choice = z.union([word, z.array(word).max(30)]).optional();
const amount = z.number().finite().min(0).optional();

export const carListingFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  dealership: word.optional(),
  city: word.optional(),
  make: choice,
  bodyType: choice,
  fuelType: choice,
  transmission: choice,
  color: word.optional(),
  minSeats: z.number().int().min(1).max(50).nullable().optional(),
  minPrice: amount,
  maxPrice: amount,
  minYear: z.number().int().min(1900).max(2100).optional(),
  maxYear: z.number().int().min(1900).max(2100).optional(),
  minMileage: amount,
  maxMileage: amount,
  featured: z.boolean().optional(),
  sortBy: z.string().max(20).optional(),
  exact: z.boolean().optional(),
});

export const carListingInputSchema = carListingFiltersSchema.extend({
  page: z.number().int().min(1).max(10_000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/** The compare page's selection: one to MAX_COMPARE_CARS car ids. */
export const compareCarsRequestSchema = z.array(z.string().uuid()).min(1).max(MAX_COMPARE_CARS);

export type CarListingFiltersInput = z.infer<typeof carListingFiltersSchema>;
export type CarListingInput = z.infer<typeof carListingInputSchema>;
