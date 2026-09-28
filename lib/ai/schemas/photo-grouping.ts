import { z } from "zod";

/**
 * A batch of a dealer's photos, sorted into cars. Sent to the model as the
 * response schema and used to validate the reply.
 *
 * Photos are referred to by their 0-based position in the batch, so the reply
 * carries no image content — and the service checks every index, since a
 * model can repeat, skip or invent one.
 */
export const photoGroupingSchema = z.object({
  cars: z.array(
    z.object({
      // What the dealer sees on the group: "white Hyundai Elantra". Never a
      // plate; the service strips digit runs anyway.
      label: z.string().max(80),
      photos: z.array(z.number().int()),
      // The (up to three) photos that best identify this car — rear badge,
      // front, dashboard — for the listing read that follows.
      readWith: z.array(z.number().int()),
    })
  ),
});

export type PhotoGroupingReply = z.infer<typeof photoGroupingSchema>;
