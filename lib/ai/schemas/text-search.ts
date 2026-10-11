import { z } from "zod";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";

/**
 * A buyer's description of the car they want, as search filters.
 *
 * Every filter is answerable as empty ("" or null) so the model can leave out
 * what the buyer did not say — an empty filter drops out of the URL, where a
 * guessed one silently hides the cars they wanted. The enums are the values
 * the filters match by equality; `keywords` carries everything else (a model,
 * a feature, a place, "family") into the text search, which handles words.
 */
const amount = z.number().int().min(0).max(1_000_000_000).nullable();

export const textSearchSchema = z.object({
  make: z.string().max(50),
  bodyType: z.enum(["", ...BODY_TYPES]),
  fuelType: z.enum(["", ...FUEL_TYPES]),
  transmission: z.enum(["", ...TRANSMISSIONS]),
  color: z.string().max(30),
  minPrice: amount,
  maxPrice: amount,
  minYear: z.number().int().min(1950).max(2100).nullable(),
  maxYear: z.number().int().min(1950).max(2100).nullable(),
  maxMileage: amount,
  minSeats: z.number().int().min(1).max(20).nullable(),
  keywords: z.string().max(120),
});

export type TextSearchExtraction = z.infer<typeof textSearchSchema>;
