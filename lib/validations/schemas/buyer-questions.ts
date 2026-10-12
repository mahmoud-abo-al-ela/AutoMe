import { z } from "zod";

/**
 * The inbox's views: the three statuses, plus "For every car" — the answered
 * questions the dealer marked as true of every car they sell.
 */
export const BUYER_QUESTION_VIEWS = ["OPEN", "ANSWERED", "ALL_CARS", "DISMISSED"] as const;
export type BuyerQuestionView = (typeof BUYER_QUESTION_VIEWS)[number];

export const buyerQuestionListSchema = z.object({
  view: z.enum(BUYER_QUESTION_VIEWS),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

/**
 * A dealer's answer. Bounded because every answer on a car, and every answer
 * marked for all cars, is sent to the model with each buyer question.
 */
export const answerBuyerQuestionSchema = z.object({
  id: z.string().uuid(),
  answer: z.string().trim().min(1).max(500),
  appliesToAllCars: z.boolean(),
});

export const buyerQuestionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["OPEN", "DISMISSED"]),
});
