import { z } from "zod";

/**
 * The words around a dealership's weekly numbers. Cut rather than rejected
 * when long: a summary a sentence too long is still worth sending.
 */
export const weeklySummarySchema = z.object({
  summary: z.string().transform((text) => text.trim().slice(0, 500)),
  tip: z.string().transform((text) => text.trim().slice(0, 240)),
});

export type WeeklySummary = z.infer<typeof weeklySummarySchema>;
