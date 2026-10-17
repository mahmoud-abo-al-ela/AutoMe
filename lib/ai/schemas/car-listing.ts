import { z } from "zod";
import {
  BODY_TYPES,
  CAR_COLORS,
  FUEL_TYPES,
  TRANSMISSIONS,
} from "@/lib/constants/car-options";

/** car-options exports plain string[]; z.enum needs a non-empty tuple. */
const tuple = (values: string[]) => values as [string, ...string[]];

const currentYear = new Date().getFullYear();

const modelYear = z.coerce.number().int().min(1900).max(currentYear + 1);

export const carListingSchema = z.object({
  identification: z.string().transform((text) => text.slice(0, 600)),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  yearFrom: modelYear,
  yearTo: modelYear,
  year: modelYear,
  color: z.enum(tuple(CAR_COLORS)),
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

  titleEn: z.string().min(1).max(200),
  titleAr: z.string().min(1).max(200),
  descriptionEn: z.string().max(2000),
  descriptionAr: z.string().max(2000),

  featuresEn: z.array(z.string().max(80)).max(30),
  featuresAr: z.array(z.string().max(80)).max(30),
  confidence: z.coerce.number().min(0).max(1),
});

export type CarListingExtraction = z.infer<typeof carListingSchema>;
