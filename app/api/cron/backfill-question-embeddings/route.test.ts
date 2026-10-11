import { describe, it, expect, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({ findQuestionsMissingEmbedding: vi.fn(), setQuestionEmbedding: vi.fn() }));
const embedTexts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/buyer-question", () => repo);
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts, embeddingModel: () => "gemini-embedding-2" }));

import { POST } from "./route";

const call = (query = "", auth = "Bearer s3cret") =>
  POST(new Request(`https://x/api/cron/backfill-question-embeddings${query}`, { method: "POST", headers: { authorization: auth } }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "s3cret";
});

describe("POST /api/cron/backfill-question-embeddings", () => {
  it("refuses without a configured secret, and with a wrong one", async () => {
    delete process.env.CRON_SECRET;
    expect((await call()).status).toBe(500);
    process.env.CRON_SECRET = "s3cret";
    expect((await call("", "Bearer nope")).status).toBe(401);
    expect(repo.findQuestionsMissingEmbedding).not.toHaveBeenCalled();
  });

  it("embeds a batch in one request and stores each vector in its own dealership", async () => {
    repo.findQuestionsMissingEmbedding.mockResolvedValue([
      { id: "q1", organizationId: "org-a", question: "Accidents?" },
      { id: "q2", organizationId: "org-b", question: "Installments?" },
    ]);
    embedTexts.mockResolvedValue({ model: "gemini-embedding-2", vectors: [[1], [2]] });

    const response = await call("?limit=2");

    expect(embedTexts).toHaveBeenCalledTimes(1);
    expect(repo.setQuestionEmbedding.mock.calls.map((c) => [c[0].id, c[0].organizationId, c[0].vector])).toEqual([
      ["q1", "org-a", [1]],
      ["q2", "org-b", [2]],
    ]);
    expect(await response.json()).toEqual({ embedded: 2, next: "q2" });
  });

  it("says it is done when a batch comes back short", async () => {
    repo.findQuestionsMissingEmbedding.mockResolvedValue([{ id: "q1", organizationId: "org-a", question: "x" }]);
    embedTexts.mockResolvedValue({ model: "gemini-embedding-2", vectors: [[1]] });
    expect(await (await call("?limit=50")).json()).toEqual({ embedded: 1, next: null });
  });

  it("answers 500 when the embedding fails, storing nothing", async () => {
    repo.findQuestionsMissingEmbedding.mockResolvedValue([{ id: "q1", organizationId: "org-a", question: "x" }]);
    embedTexts.mockRejectedValue(new Error("busy"));
    expect((await call()).status).toBe(500);
    expect(repo.setQuestionEmbedding).not.toHaveBeenCalled();
  });
});
