import { embedTexts, embeddingModel } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { MAX_DEALER_ANSWERS } from "@/lib/repositories/buyer-question";
import { logError } from "@/lib/utils/errors";

/**
 * Buyer questions by meaning, not by wording: the same question rephrased —
 * or asked in the other language — is one question.
 *
 * Thresholds are cosine similarity between two questions' vectors. Measured on
 * gemini-embedding-2 (2026-10-11): an English question and its Egyptian-Arabic
 * paraphrase 0.82, unrelated questions about the same car ~0.6. The retrieval
 * evaluation (lib/ai/evaluation/retrieval.eval.test.ts) is what moves them.
 */

/** Folding deletes a row, so only near-certain repeats fold. */
export const FOLD_SIMILARITY = 0.86;
/** A suggestion is a dealer's click away from being used, so it can reach further. */
export const SUGGEST_SIMILARITY = 0.78;

/** Platform housekeeping: metered, billed to no one, behind dealers' own AI. */
const CALLER = { organizationId: null, userId: null, priority: "low" as const };

/**
 * The question-embedding job: give a declined question its vector, or fold it
 * into the earlier question it repeats on the same car. Idempotent — a
 * question already embedded by the current model, or gone, is left alone.
 * Throws when the embedding fails, so the queue retries.
 */
export async function embedQuestion(questionId: string, organizationId: string): Promise<"embedded" | "folded" | "skipped"> {
  const row = await buyerQuestionRepository.findQuestionForEmbedding(questionId, organizationId);
  if (!row || row.embeddingModel === embeddingModel()) return "skipped";

  const { model, vectors } = await embedTexts({
    feature: AI_FEATURES.questionEmbedding,
    texts: [row.question],
    task: "similarity",
    ctx: { ...CALLER, organizationId },
  });
  const [vector] = vectors;

  if (row.status === "OPEN") {
    const nearest = await buyerQuestionRepository.findNearestEarlierQuestion({
      organizationId,
      carId: row.carId,
      excludeId: row.id,
      before: row.createdAt,
      vector,
      model,
    });
    if (nearest && nearest.similarity >= FOLD_SIMILARITY) {
      const folded = await buyerQuestionRepository.foldQuestionInto({ fromId: row.id, intoId: nearest.id, organizationId });
      if (folded) return "folded";
    }
  }

  await buyerQuestionRepository.setQuestionEmbedding({ id: row.id, organizationId, vector, model });
  return "embedded";
}

/**
 * The dealer's answers that reach the model for one car. While they all fit,
 * all of them, most-asked first. Beyond that, the ones closest in meaning to
 * what the buyer asked — the most-asked twenty may not include the one that
 * answers this. If the question cannot be embedded, most-asked it is.
 */
export async function dealerAnswersForQuestion(input: { carId: string; organizationId: string; question: string }) {
  const answers = await buyerQuestionRepository.findAnswersForCar(input.carId, input.organizationId);
  if (answers.length < MAX_DEALER_ANSWERS) return answers;

  try {
    const { model, vectors } = await embedTexts({
      feature: AI_FEATURES.questionEmbedding,
      texts: [input.question],
      task: "similarity",
      ctx: { ...CALLER, organizationId: input.organizationId },
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
    return answers;
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
