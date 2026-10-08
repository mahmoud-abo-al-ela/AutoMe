import { z } from "zod";

/**
 * A dealership's description and address in the target language. Sent to the
 * model as the response schema and used to validate the reply. A field that
 * was not sent comes back empty. A little more room than the profile form's
 * limits: Arabic often runs longer than its English.
 */
export const dealershipProfileSchema = z.object({
  description: z.string().max(1500),
  address: z.string().max(400),
});

export type DealershipProfileTranslation = z.infer<typeof dealershipProfileSchema>;
