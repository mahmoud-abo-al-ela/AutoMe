import { z } from "zod";

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
