import { describe, it, expect, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({ findCarForEmbedding: vi.fn(), setCarEmbedding: vi.fn(), findCarsMissingEmbedding: vi.fn() }));
const embedTexts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/car", () => repo);
vi.mock("@/lib/ai/embeddings", () => ({ embedTexts, embeddingModel: () => "gemini-embedding-2" }));

import { backfillCarEmbeddings, embedCar } from "@/lib/services/car/embedding";
import { carEmbeddingText, embeddingHash } from "@/lib/services/car/embedding-text";

const car = {
  id: "car-1",
  organizationId: "org",
  make: "Kia",
  model: "Sportage",
  year: 2021,
  bodyType: "SUV",
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "Grey",
  seats: 5,
  title: null,
  titleEn: "Kia Sportage 2021",
  titleAr: null,
  description: null,
  descriptionEn: "Family SUV, panoramic roof.",
  descriptionAr: null,
  features: [],
  featuresAr: [],
  embeddingModel: null as string | null,
  embeddingHash: null as string | null,
};

beforeEach(() => {
  vi.clearAllMocks();
  embedTexts.mockImplementation(async ({ texts }: { texts: string[] }) => ({ model: "gemini-embedding-2", vectors: texts.map(() => [0.1]) }));
});

describe("embedCar", () => {
  it("embeds the car as a retrieval document and stores it with its fingerprint, in its dealership", async () => {
    repo.findCarForEmbedding.mockResolvedValue(car);
    expect(await embedCar("car-1", "org")).toBe("embedded");
    expect(embedTexts.mock.calls[0][0]).toMatchObject({ feature: "carEmbedding", task: "document", texts: [carEmbeddingText(car)] });
    expect(repo.setCarEmbedding).toHaveBeenCalledWith({
      id: "car-1",
      organizationId: "org",
      vector: [0.1],
      model: "gemini-embedding-2",
      hash: embeddingHash(carEmbeddingText(car), "gemini-embedding-2"),
    });
  });

  it("spends nothing on a save that changed none of its text", async () => {
    const hash = embeddingHash(carEmbeddingText(car), "gemini-embedding-2");
    repo.findCarForEmbedding.mockResolvedValue({ ...car, embeddingModel: "gemini-embedding-2", embeddingHash: hash });
    expect(await embedCar("car-1", "org")).toBe("skipped");
    expect(embedTexts).not.toHaveBeenCalled();
  });

  it("re-embeds after an edit to its text", async () => {
    repo.findCarForEmbedding.mockResolvedValue({ ...car, embeddingModel: "gemini-embedding-2", embeddingHash: "old" });
    expect(await embedCar("car-1", "org")).toBe("embedded");
  });

  it("skips a car that is gone", async () => {
    repo.findCarForEmbedding.mockResolvedValue(null);
    expect(await embedCar("car-1", "org")).toBe("skipped");
  });
});

describe("backfillCarEmbeddings", () => {
  it("embeds a batch in one request, each stored in its own dealership", async () => {
    repo.findCarsMissingEmbedding.mockResolvedValue([car, { ...car, id: "car-2", organizationId: "org-2" }]);
    expect(await backfillCarEmbeddings(2)).toEqual({ embedded: 2, next: "car-2" });
    expect(embedTexts).toHaveBeenCalledTimes(1);
    expect(repo.setCarEmbedding.mock.calls.map((c) => [c[0].id, c[0].organizationId])).toEqual([
      ["car-1", "org"],
      ["car-2", "org-2"],
    ]);
  });

  it("says it is done on a short batch", async () => {
    repo.findCarsMissingEmbedding.mockResolvedValue([]);
    expect(await backfillCarEmbeddings(100)).toEqual({ embedded: 0, next: null });
  });
});
