import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { NotFoundError } from "@/lib/utils/errors";
import { answerSuggestions } from "./meaning";

type InboxView = Parameters<typeof buyerQuestionRepository.findBuyerQuestions>[1];

/** One page of a view, every view's count, and — for open questions — answers worth reusing. */
export async function getInbox(organizationId: string, view: InboxView, page: number, pageSize: number) {
  const [{ questions, total }, counts] = await Promise.all([
    buyerQuestionRepository.findBuyerQuestions(organizationId, view, page, pageSize),
    buyerQuestionRepository.countBuyerQuestionsByView(organizationId),
  ]);
  // Unanswered only: an answer the dealer already gave on another car that
  // says the same, one click from being reused. Scoped to this dealership.
  const suggestions = view === "OPEN" ? await answerSuggestions(organizationId, questions.map((q) => q.id)) : [];
  const suggestionFor = new Map(suggestions.map(({ questionId, ...rest }) => [questionId, rest]));

  return {
    questions: questions.map((question) => ({ ...question, suggestion: suggestionFor.get(question.id) ?? null })),
    counts,
    total,
  };
}

/** Answer a question. `answeredById` is the database User.id, the foreign key — not a Clerk id. */
export async function answerQuestion(input: Parameters<typeof buyerQuestionRepository.answerBuyerQuestion>[0]) {
  const changed = await buyerQuestionRepository.answerBuyerQuestion(input);
  if (changed === 0) throw new NotFoundError("Question");
}

/** Dismiss a question, or reopen it. */
export async function setQuestionStatus(input: Parameters<typeof buyerQuestionRepository.setBuyerQuestionStatus>[0]) {
  const changed = await buyerQuestionRepository.setBuyerQuestionStatus(input);
  if (changed === 0) throw new NotFoundError("Question");
}
