import { z } from "zod";
import { BODY_TYPES } from "@/lib/constants/car-options";

/**
 * Search filters extracted from a buyer's photo on the home hero.
 *
 * Every field is answerable as "" so the model can decline rather than guess —
 * an empty filter drops out of the URL, where a wrong one returns zero results.
 * `bodyType` is an enum plus "" for the same reason the listing schema uses
 * enums: the value is about to become a query parameter matched by equality, so
 * anything outside the allowlist is silently a dead end.
 */
export const imageSearchSchema = z.object({
  make: z.string().max(50),
  bodyType: z.enum(["", ...BODY_TYPES]),
  color: z.string().max(50),
  confidence: z.coerce.number().min(0).max(1),
});

export type ImageSearchExtraction = z.infer<typeof imageSearchSchema>;
