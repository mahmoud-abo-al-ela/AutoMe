import { embedTexts, embeddingModel } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { MAX_DEALER_ANSWERS } from "@/lib/repositories/buyer-question";
import { logError } from "@/lib/utils/errors";

/**
 * Buyer questions by meaning, not by wording: the same question rephrased —
 * or asked in the other language — is one question.
 *
 * Thresholds are cosine similarity between two questions' vectors, set from
 * the retrieval evaluation (lib/ai/evaluation/retrieval.eval.test.ts — 32
 * questions, 8 meanings, English, MSA and Egyptian Arabic) on
 * gemini-embedding-2, 2026-10-11:
 *
 *   same question      median 0.773 · p25 0.727 · min 0.493
 *   different question median 0.613 · p98 0.775 · max 0.851
 *
 * The two overlap, so no single line separates them; each use picks its own
 * side of the overlap by what a mistake costs. Rerun the evaluation before
 * moving either, and after changing AI_EMBEDDING_MODEL.
 */

/**
 * Folding deletes a row, so it sits well above the closest two different
 * questions ever came (0.851): only near-identical rephrasings fold.
 */
export const FOLD_SIMILARITY = 0.9;
/**
 * A suggestion costs a dealer a glance, and is theirs to accept: at the
 * different-question 98th percentile, where it finds about half the same
 * questions and is wrong about 1.6% of the time.
 */
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

/**
 * The question-embedding job: give a declined question its vector — folding
 * it into an earlier open question it repeats on the same car, or linking it to
 * an answered one it rephrases (the dealer's answer existed and the assistant
 * did not use it). Idempotent — a
 * question already embedded by the current model, or gone, is left alone.
 * Throws when the embedding fails, so the queue retries.
 */
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

/**
 * The dealer's answers that reach the model for one car. While they all fit,
 * all of them, most-asked first. Beyond that, the ones closest in meaning to
 * what the buyer asked — the most-asked twenty may not include the one that
 * answers this. If the question cannot be embedded, most-asked it is.
 */
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
