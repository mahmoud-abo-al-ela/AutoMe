import { z } from "zod";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";

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
