"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  answerBuyerQuestionSchema,
  buyerQuestionListSchema,
  buyerQuestionStatusSchema,
} from "@/lib/validations/schemas";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

/**
 * The dealer's inbox of questions the listing assistant could not answer.
 *
 * Every read and write is scoped to ctx.organization.id inside the query, so
 * an id from another dealership matches nothing. Any member may answer: the
 * people who talk to buyers are rarely the owner. Not rate-limited — these
 * are authenticated writes to the dealer's own rows and call no provider.
 */

const PAGE_SIZE = 20;

export const getBuyerQuestions = withOrgAuth(async (ctx, input: unknown) => {
  const { view, page } = validateAction(buyerQuestionListSchema, input);
  const [{ questions, total }, counts] = await Promise.all([
    buyerQuestionRepository.findBuyerQuestions(ctx.organization.id, view, page, PAGE_SIZE),
    buyerQuestionRepository.countBuyerQuestionsByView(ctx.organization.id),
  ]);

  return createSuccessResponse({
    questions,
    counts,
    pagination: { page, limit: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
});

export const answerBuyerQuestion = withOrgAuth(async (ctx, input: unknown) => {
  const { id, answer, appliesToAllCars } = validateAction(answerBuyerQuestionSchema, input);
  const changed = await buyerQuestionRepository.answerBuyerQuestion({
    organizationId: ctx.organization.id,
    id,
    answer,
    appliesToAllCars,
    // The database User.id, not ctx.userId (the Clerk id): the foreign key.
    answeredById: ctx.user.id,
  });
  if (changed === 0) throw new NotFoundError("Question");

  return createSuccessResponse({ id });
});

export const setBuyerQuestionStatus = withOrgAuth(async (ctx, input: unknown) => {
  const { id, status } = validateAction(buyerQuestionStatusSchema, input);
  const changed = await buyerQuestionRepository.setBuyerQuestionStatus({
    organizationId: ctx.organization.id,
    id,
    status,
  });
  if (changed === 0) throw new NotFoundError("Question");

  return createSuccessResponse({ id });
});
