import { embedTexts, embeddingModel } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { MAX_DEALER_ANSWERS } from "@/lib/repositories/buyer-question";
import { logError } from "@/lib/utils/errors";

/**
 * Folding deletes a row, so it sits well above the closest two different
 * questions ever came (0.851): only near-identical rephrasings fold.
 */
export const FOLD_SIMILARITY = 0.9;
export const SUGGEST_SIMILARITY = 0.78;
/**
 * Linking a declined question to the answered one it rephrases flags it for
 * the dealer and shows both; a wrong link costs a glance, like a suggestion.
 */
export const RELATED_SIMILARITY = SUGGEST_SIMILARITY;

/** How long a buyer's answer may wait on embedding their question. */
const BUYER_WAIT_MS = 2_000;

/**
 * Metered, billed to no one. Standard priority within the embedding pool: a
 * dealer's own questions come before anonymous search (see carSearchQuery).
 */
const CALLER = { organizationId: null, userId: null, priority: "standard" as const };

export async function embedQuestion(
  questionId: string,
  organizationId: string
): Promise<"embedded" | "folded" | "linked" | "skipped"> {
  const row = await buyerQuestionRepository.findQuestionForEmbedding(questionId, organizationId);
  if (!row || row.embeddingModel === embeddingModel()) return "skipped";

  const { model, vectors } = await embedTexts({
    feature: AI_FEATURES.questionEmbedding,
    texts: [row.question],
    task: "similarity",
    ctx: { ...CALLER, organizationId },
  });
  const [vector] = vectors;

  let related = false;
  if (row.status === "OPEN") {
    const nearest = (statuses: ("OPEN" | "ANSWERED")[]) =>
      buyerQuestionRepository.findNearestEarlierQuestion({
        organizationId,
        carId: row.carId,
        excludeId: row.id,
        before: row.createdAt,
        vector,
        model,
        statuses,
      });
    const [open, answered] = await Promise.all([nearest(["OPEN"]), nearest(["ANSWERED"])]);

    // A repeat of a question still waiting for the dealer: one question.
    if (open && open.similarity >= FOLD_SIMILARITY) {
      const folded = await buyerQuestionRepository.foldQuestionInto({ fromId: row.id, intoId: open.id, organizationId });
      if (folded) return "folded";
    }
    // A rephrasing of a question the dealer already answered, declined anyway:
    // never folded — that would hide the miss. Kept open and linked, so the
    // dealer sees the assistant had their answer and did not use it.
    if (answered && answered.similarity >= RELATED_SIMILARITY) {
      await buyerQuestionRepository.linkRelatedQuestion({ id: row.id, relatedId: answered.id, organizationId });
      related = true;
    }
  }

  await buyerQuestionRepository.setQuestionEmbedding({ id: row.id, organizationId, vector, model });
  return related ? "linked" : "embedded";
}

export async function dealerAnswersForQuestion(input: { carId: string; organizationId: string; question: string }) {
  // One more than fit, to know whether any were left out at all.
  const answers = await buyerQuestionRepository.findAnswersForCar(input.carId, input.organizationId, MAX_DEALER_ANSWERS + 1);
  if (answers.length <= MAX_DEALER_ANSWERS) return answers;
  const mostAsked = answers.slice(0, MAX_DEALER_ANSWERS);

  try {
    const { model, vectors } = await embedTexts({
      feature: AI_FEATURES.questionEmbedding,
      texts: [input.question],
      task: "similarity",
      ctx: { ...CALLER, organizationId: input.organizationId },
      // A buyer is waiting: a slow embedding falls back to most-asked fast.
      timeoutMs: BUYER_WAIT_MS,
    });
    return await buyerQuestionRepository.findAnswersForCarByMeaning({
      carId: input.carId,
      organizationId: input.organizationId,
      vector: vectors[0],
      model,
      take: MAX_DEALER_ANSWERS,
    });
  } catch (error) {
    logError("Ranking dealer answers by meaning failed; using the most-asked", error);
    return mostAsked;
  }
}

export interface AnswerSuggestion {
  /** The open question it is for. */
  questionId: string;
  /** The answered question it comes from, on another car. */
  question: string;
  answer: string;
  appliesToAllCars: boolean;
}

/** For each open question, an answer the dealer already gave on another car that says the same. */
export async function answerSuggestions(organizationId: string, openQuestionIds: string[]): Promise<AnswerSuggestion[]> {
  try {
    const rows = await buyerQuestionRepository.findAnswerSuggestions(organizationId, openQuestionIds);
    return rows
      .filter((row) => row.similarity >= SUGGEST_SIMILARITY)
      .map(({ questionId, question, answer, appliesToAllCars }) => ({ questionId, question, answer, appliesToAllCars }));
  } catch (error) {
    logError("Finding answer suggestions failed; showing the inbox without them", error);
    return [];
  }
}

export async function backfillQuestionEmbeddings(limit: number, after?: string) {
  const questions = await buyerQuestionRepository.findQuestionsMissingEmbedding(embeddingModel(), limit, after);
  if (questions.length === 0) return { embedded: 0, next: null };

  const { model, vectors } = await embedTexts({
    feature: AI_FEATURES.questionEmbedding,
    texts: questions.map((q) => q.question),
    task: "similarity",
    ctx: { organizationId: null, userId: null, priority: "low" },
  });
  for (const [i, question] of questions.entries()) {
    // Scoped to the question's own dealership in the WHERE.
    await buyerQuestionRepository.setQuestionEmbedding({
      id: question.id,
      organizationId: question.organizationId,
      vector: vectors[i],
      model,
    });
  }
  return { embedded: questions.length, next: questions.length === limit ? questions.at(-1)!.id : null };
}
