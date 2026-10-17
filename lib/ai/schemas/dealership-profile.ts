import { z } from "zod";

export const dealershipProfileSchema = z.object({
  description: z.string().max(1500),
  address: z.string().max(400),
  financingNote: z.string().max(400),
});

export type DealershipProfileTranslation = z.infer<typeof dealershipProfileSchema>;
