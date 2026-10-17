import { z } from "zod";
import { BODY_TYPES } from "@/lib/constants/car-options";

export const imageSearchSchema = z.object({
  make: z.string().max(50),
  bodyType: z.enum(["", ...BODY_TYPES]),
  color: z.string().max(50),
  confidence: z.coerce.number().min(0).max(1),
});

export type ImageSearchExtraction = z.infer<typeof imageSearchSchema>;
