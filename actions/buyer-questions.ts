"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  answerBuyerQuestionSchema,
  buyerQuestionListSchema,
  buyerQuestionStatusSchema,
} from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import * as inbox from "@/lib/services/buyer-question/inbox";

const PAGE_SIZE = 20;

export const getBuyerQuestions = withOrgAuth(async (ctx, input: unknown) => {
  const { view, page } = validateAction(buyerQuestionListSchema, input);
  const { questions, counts, total } = await inbox.getInbox(ctx.organization.id, view, page, PAGE_SIZE);

  return createSuccessResponse({
    questions,
    counts,
    pagination: { page, limit: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
});

export const answerBuyerQuestion = withOrgAuth(async (ctx, input: unknown) => {
  const { id, answer, appliesToAllCars } = validateAction(answerBuyerQuestionSchema, input);
  await inbox.answerQuestion({
    organizationId: ctx.organization.id,
    id,
    answer,
    appliesToAllCars,
    // The database User.id, not ctx.userId (the Clerk id): the foreign key.
    answeredById: ctx.user.id,
  });

  return createSuccessResponse({ id });
});

export const setBuyerQuestionStatus = withOrgAuth(async (ctx, input: unknown) => {
  const { id, status } = validateAction(buyerQuestionStatusSchema, input);
  await inbox.setQuestionStatus({ organizationId: ctx.organization.id, id, status });

  return createSuccessResponse({ id });
});
