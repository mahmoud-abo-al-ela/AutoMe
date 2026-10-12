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

/**
 * The listing as the dealer's form currently holds it, for the quality coach.
 * Bounded like the car schema so a crafted request cannot send the model an
 * arbitrarily large prompt.
 */
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

/**
 * A buyer's question about one listing. The id is a uuid because it keys the
 * per-car rate limit: free text there would let a caller open a fresh bucket
 * per request. The question is short because it is billed to the dealer and
 * sent to the model verbatim.
 */
export const listingQuestionSchema = z.object({
  carId: z.string().uuid(),
  question: z.string().trim().min(2).max(300),
  locale: z.enum(["en", "ar"]),
  /**
   * The last few replies, by id, so a follow-up ("and the price?") can be
   * read. Ids, not text: the server reads back what it said, so a page
   * cannot put words in the assistant's mouth. Bounded at four exchanges.
   */
  historyIds: z.array(z.string().uuid()).max(4).default([]),
});

export type ListingQuestionInput = z.infer<typeof listingQuestionSchema>;

/** A buyer rates one answer the listing assistant gave. */
export const listingAnswerRatingSchema = z.object({
  answerId: z.string().uuid(),
  helpful: z.boolean(),
});
