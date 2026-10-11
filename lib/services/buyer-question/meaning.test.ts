import { describe, it, expect, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({
  MAX_DEALER_ANSWERS: 20,
  findQuestionForEmbedding: vi.fn(),
  findNearestEarlierQuestion: vi.fn(),
  foldQuestionInto: vi.fn(),
  linkRelatedQuestion: vi.fn(),
  setQuestionEmbedding: vi.fn(),
  findAnswersForCar: vi.fn(),
  findAnswersForCarByMeaning: vi.fn(),
  findAnswerSuggestions: vi.fn(),
}));
const embedTexts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/repositories/buyer-question", () => repo);
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts, embeddingModel: () => "gemini-embedding-2" }));

import { answerSuggestions, dealerAnswersForQuestion, embedQuestion } from "@/lib/services/buyer-question/meaning";
import { ServiceUnavailableError } from "@/lib/utils/errors";

const VECTOR = [0.1, 0.2];
const question = (over: Record<string, unknown> = {}) => ({
  id: "q2",
  organizationId: "org",
  carId: "car",
  question: "Has it had an accident?",
  status: "OPEN",
  embeddingModel: null,
  createdAt: new Date("2026-10-11T10:00:00Z"),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  embedTexts.mockResolvedValue({ model: "gemini-embedding-2", vectors: [VECTOR] });
  repo.foldQuestionInto.mockResolvedValue(true);
});

describe("embedQuestion", () => {
  /** The nearest earlier question by status: what the two searches find. */
  const nearest = (open: { id: string; similarity: number } | null, answered: { id: string; similarity: number } | null) =>
    repo.findNearestEarlierQuestion.mockImplementation(async ({ statuses }: { statuses: string[] }) =>
      statuses.includes("OPEN") ? open : answered
    );

  it("folds an open question into the earlier one it repeats", async () => {
    repo.findQuestionForEmbedding.mockResolvedValue(question());
    nearest({ id: "q1", similarity: 0.93 }, null);

    expect(await embedQuestion("q2", "org")).toBe("folded");
    expect(repo.foldQuestionInto).toHaveBeenCalledWith({ fromId: "q2", intoId: "q1", organizationId: "org" });
    expect(repo.setQuestionEmbedding).not.toHaveBeenCalled();
  });

  it("never folds into a question the dealer answered — it links instead, so the miss shows", async () => {
    repo.findQuestionForEmbedding.mockResolvedValue(question());
    nearest(null, { id: "answered-1", similarity: 0.95 });

    expect(await embedQuestion("q2", "org")).toBe("linked");
    expect(repo.foldQuestionInto).not.toHaveBeenCalled();
    expect(repo.linkRelatedQuestion).toHaveBeenCalledWith({ id: "q2", relatedId: "answered-1", organizationId: "org" });
    expect(repo.setQuestionEmbedding).toHaveBeenCalled();
  });

  it("keeps a question that is only related, and stores its meaning", async () => {
    repo.findQuestionForEmbedding.mockResolvedValue(question());
    nearest({ id: "q1", similarity: 0.86 }, { id: "answered-1", similarity: 0.7 });

    expect(await embedQuestion("q2", "org")).toBe("embedded");
    expect(repo.setQuestionEmbedding).toHaveBeenCalledWith({ id: "q2", organizationId: "org", vector: VECTOR, model: "gemini-embedding-2" });
  });

  it("never folds a question the dealer has answered", async () => {
    repo.findQuestionForEmbedding.mockResolvedValue(question({ status: "ANSWERED" }));
    expect(await embedQuestion("q2", "org")).toBe("embedded");
    expect(repo.findNearestEarlierQuestion).not.toHaveBeenCalled();
  });

  it("spends nothing on a question already embedded by this model, or gone", async () => {
    repo.findQuestionForEmbedding.mockResolvedValueOnce(question({ embeddingModel: "gemini-embedding-2" }));
    expect(await embedQuestion("q2", "org")).toBe("skipped");
    repo.findQuestionForEmbedding.mockResolvedValueOnce(null);
    expect(await embedQuestion("q2", "org")).toBe("skipped");
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("throws when the embedding fails, so the queue retries", async () => {
    repo.findQuestionForEmbedding.mockResolvedValue(question());
    embedTexts.mockRejectedValue(new ServiceUnavailableError("busy"));
    await expect(embedQuestion("q2", "org")).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});

describe("dealerAnswersForQuestion", () => {
  const answers = (n: number) => Array.from({ length: n }, (_, i) => ({ question: `q${i}`, answer: "a", appliesToAllCars: false }));

  it("sends every answer while they all fit, with no embedding call", async () => {
    repo.findAnswersForCar.mockResolvedValue(answers(5));
    expect(await dealerAnswersForQuestion({ carId: "car", organizationId: "org", question: "x" })).toHaveLength(5);
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("spends no embedding when exactly as many as fit", async () => {
    repo.findAnswersForCar.mockResolvedValue(answers(20));
    expect(await dealerAnswersForQuestion({ carId: "car", organizationId: "org", question: "x" })).toHaveLength(20);
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("ranks by meaning once there are more than fit, with a short wait for the buyer", async () => {
    repo.findAnswersForCar.mockResolvedValue(answers(21));
    repo.findAnswersForCarByMeaning.mockResolvedValue(answers(20).reverse());
    const result = await dealerAnswersForQuestion({ carId: "car", organizationId: "org", question: "instalments?" });
    expect(result[0].question).toBe("q19");
    expect(repo.findAnswersForCarByMeaning).toHaveBeenCalledWith(expect.objectContaining({ vector: VECTOR, take: 20 }));
    expect(embedTexts.mock.calls[0][0].timeoutMs).toBe(2_000);
  });

  it("falls back to the most-asked that fit when the question cannot be embedded", async () => {
    repo.findAnswersForCar.mockResolvedValue(answers(21));
    embedTexts.mockRejectedValue(new ServiceUnavailableError("busy"));
    const result = await dealerAnswersForQuestion({ carId: "car", organizationId: "org", question: "x" });
    expect(result[0].question).toBe("q0");
    expect(result).toHaveLength(20);
  });
});

describe("answerSuggestions", () => {
  it("offers only answers close enough to be the same question", async () => {
    repo.findAnswerSuggestions.mockResolvedValue([
      { questionId: "a", sourceId: "s1", question: "Do you do installments?", answer: "Yes, 5 years", appliesToAllCars: false, similarity: 0.83 },
      { questionId: "b", sourceId: "s2", question: "Colour?", answer: "White", appliesToAllCars: false, similarity: 0.62 },
    ]);
    expect(await answerSuggestions("org", ["a", "b"])).toEqual([
      { questionId: "a", question: "Do you do installments?", answer: "Yes, 5 years", appliesToAllCars: false },
    ]);
  });

  it("shows the inbox without suggestions when they cannot be read", async () => {
    repo.findAnswerSuggestions.mockRejectedValue(new Error("no pgvector"));
    expect(await answerSuggestions("org", ["a"])).toEqual([]);
  });
});
