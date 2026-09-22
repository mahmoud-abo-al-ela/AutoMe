import { z } from "zod";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
} from "@/lib/constants/car-options";

/**
 * The car fields the vision model extracts from a photo.
 *
 * This schema does double duty: it is sent to Gemini as the response schema and
 * it validates what comes back. One definition, so the two cannot drift.
 *
 * The enum fields matter most. Constraining them here means the API itself
 * refuses anything outside the allowlist, which is why the old
 * "Sport Utility Vehicle (SUV)" hand-patch in AICarForm is no longer needed —
 * the model can no longer produce it.
 */

/** car-options exports plain string[]; z.enum needs a non-empty tuple. */
const tuple = (values: string[]) => values as [string, ...string[]];

const currentYear = new Date().getFullYear();

export const carListingSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.coerce.number().int().min(1900).max(currentYear + 1),
  color: z.string().min(1).max(50),
  /**
   * EGP, never converted. Egypt is the only market, and a model that helpfully
   * "converts to USD" silently divides every listing price by ~50.
   */
  price: z.coerce.number().nonnegative(),
  mileage: z.coerce.number().nonnegative(),
  bodyType: z.enum(tuple(BODY_TYPES)),
  fuelType: z.enum(tuple(FUEL_TYPES)),
  transmission: z.enum(tuple(TRANSMISSIONS)),
  seats: z.coerce.number().int().min(1).max(12),

  /**
   * Bilingual listing copy. Both languages come out of the one call that was
   * already being paid for, which is what makes this close to free: a dealer
   * types nothing and gets a listing that reads correctly to either half of the
   * market.
   *
   * The Arabic is asked for as Arabic rather than as a translation of the
   * English — Arabic is the primary market language here, and copy translated
   * word-for-word out of English reads like it.
   */
  titleEn: z.string().min(1).max(200),
  titleAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(2000),
  descriptionAr: z.string().max(2000),

  /** A union because the model has historically answered with either shape. */
  features: z.union([z.array(z.string()), z.string()]),
  confidence: z.coerce.number().min(0).max(1),
});

export type CarListingExtraction = z.infer<typeof carListingSchema>;
