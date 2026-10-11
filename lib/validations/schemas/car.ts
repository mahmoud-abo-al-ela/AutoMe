import { z } from "zod";
import { carStatus } from "./fields";

/**
 * The per-language title and description columns, shared by the create and
 * full-update schemas so the two cannot drift.
 *
 * Nullable as well as optional: clearing a field in the dealer form sends null,
 * and that has to mean "remove it" rather than fail validation.
 */
const bilingualCarText = {
  titleEn: z.string().max(200).optional().nullable(),
  titleAr: z.string().max(200).optional().nullable(),
  descriptionEn: z.string().max(2000).optional().nullable(),
  descriptionAr: z.string().max(2000).optional().nullable(),
  featuresAr: z.array(z.string()).optional(),
};

/**
 * What the dealer states about the car's history — see lib/utils/car-disclosures.
 * Nullable because null is "not stated", which the form sends to clear one.
 */
const carDisclosureFields = {
  originalPaint: z.boolean().nullable().optional(),
  accidentFree: z.boolean().nullable().optional(),
  ownerCount: z.number().int().min(1).max(20).nullable().optional(),
  serviceHistory: z.enum(["FULL", "PARTIAL", "NONE"]).nullable().optional(),
  priceNegotiable: z.boolean().nullable().optional(),
  // The month the licence runs to, as the form's month input holds it.
  licenseValidUntil: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM")
    .nullable()
    .optional(),
};

const MIN_DESCRIPTION = 10;

/**
 * A listing needs a description in at least one language, not specifically in
 * English. A dealer on the Arabic dashboard only sees the Arabic field; the
 * English one is filled by translation when the plan allows it, and when it
 * does not, English readers get the Arabic with a "not translated" note.
 */
function requireOneDescription(
  car: { description?: string | null; descriptionAr?: string | null },
  ctx: z.RefinementCtx
) {
  const long = (text?: string | null) => (text?.trim().length ?? 0) >= MIN_DESCRIPTION;
  if (!long(car.description) && !long(car.descriptionAr)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: `Description must be at least ${MIN_DESCRIPTION} characters`,
    });
  }
}

export const carSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Price must be greater than 0"),
  mileage: z.coerce.number().min(0, "Mileage cannot be negative"),
  bodyType: z.string().min(1, "Body type is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  color: z.string().min(1, "Color is required"),
  seats: z.coerce.number().int().min(1).max(12),
  // Either language may carry the description — see requireOneDescription.
  description: z.string().max(2000).optional().nullable(),
  // Bilingual copy. Optional because a manually entered listing has none, and
  // because Zod strips unknown keys — without these the AI-written Arabic is
  // silently discarded on the way to the database.
  ...bilingualCarText,
  ...carDisclosureFields,
  // A car is where its dealership is; kept only for cars saved with it.
  location: z.string().max(200).optional().nullable(),
  status: carStatus,
  featured: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  // Files from the dealer form, or data: URLs. What they contain is checked
  // at upload (lib/services/storage/upload.ts), not trusted from the claim.
  images: z
    .array(z.union([z.string().min(1), z.instanceof(File)]))
    .min(1, "At least one image is required")
    .max(20),
}).superRefine(requireOneDescription);

export const updateCarSchema = z.object({
  status: carStatus,
  featured: z.boolean().optional(),
});

export const updateCarFullSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Price must be greater than 0"),
  mileage: z.coerce.number().min(0, "Mileage cannot be negative"),
  bodyType: z.string().min(1, "Body type is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  color: z.string().min(1, "Color is required"),
  seats: z.coerce.number().int().min(1).max(12),
  // Either language may carry the description — see requireOneDescription.
  description: z.string().max(2000).optional().nullable(),
  ...bilingualCarText,
  ...carDisclosureFields,
  // A car is where its dealership is; kept only for cars saved with it.
  location: z.string().max(200).optional().nullable(),
  status: carStatus,
  featured: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.any()),
}).superRefine(requireOneDescription);

export type CarInput = z.infer<typeof carSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type UpdateCarFullInput = z.infer<typeof updateCarFullSchema>;
