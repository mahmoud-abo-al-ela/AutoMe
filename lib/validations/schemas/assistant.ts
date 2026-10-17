import { z } from "zod";

/** What buyers and dealers send to the AI features about a listing. */

/**
 * A price being typed into the car editor, to place it among similar cars.
 * `carId` is the car being edited, so it is not compared with itself.
 */
export const priceComparisonSchema = z.object({
  carId: z.string().max(64).optional(),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  bodyType: z.string().max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive().max(1_000_000_000),
});

export const listingReviewSchema = z.object({
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().max(50),
  model: z.string().max(50),
  mileage: z.coerce.number().min(0).max(10_000_000),
  bodyType: z.string().max(50),
  description: z.string().max(2000),
  features: z.array(z.string().max(80)).max(50),
  imageCount: z.coerce.number().int().min(0).max(50),
  language: z.enum(["en", "ar"]),
});

/** A buyer's description of the car they want, from the hero search. Sent to the model. */
export const describedSearchSchema = z.object({
  query: z.string().trim().min(2).max(200),
});

export const listingQuestionSchema = z.object({
  carId: z.string().uuid(),
  question: z.string().trim().min(2).max(300),
  locale: z.enum(["en", "ar"]),
  historyIds: z.array(z.string().uuid()).max(4).default([]),
});

export type ListingQuestionInput = z.infer<typeof listingQuestionSchema>;

/** A buyer rates one answer the listing assistant gave. */
export const listingAnswerRatingSchema = z.object({
  answerId: z.string().uuid(),
  helpful: z.boolean(),
});
