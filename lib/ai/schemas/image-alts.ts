import { z } from "zod";

/**
 * Alt text for a batch of car photos. Sent to Gemini as the response schema and
 * used to validate the reply.
 *
 * `index` ties each description to the photo it describes (0-based, in the
 * order the photos were sent), so a reply that skips or reorders one cannot
 * attach a description to the wrong image.
 *
 * 150 characters: screen readers read alt text in one breath, and guidance
 * converges on ~125. A little headroom for Arabic, which runs longer.
 */
export const imageAltsSchema = z.object({
  images: z
    .array(
      z.object({
        index: z.coerce.number().int().min(0),
        en: z.string().min(1).max(150),
        ar: z.string().min(1).max(150),
      })
    )
    .max(20),
});

export type ImageAltsReply = z.infer<typeof imageAltsSchema>;
