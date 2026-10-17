import { embedTexts, embeddingModel } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as carRepository from "@/lib/repositories/car";
import { carEmbeddingText, embeddingHash } from "@/lib/services/car/embedding-text";

/**
 * Metered, billed to no one. Standard priority within the embedding pool: the
 * dealers' cars come before anonymous search queries (see carSearchQuery).
 */
const CALLER = { userId: null, priority: "standard" as const };

export async function embedCar(carId: string, organizationId: string): Promise<"embedded" | "skipped"> {
  const car = await carRepository.findCarForEmbedding(carId, organizationId);
  if (!car) return "skipped";

  const model = embeddingModel();
  const text = carEmbeddingText(car);
  const hash = embeddingHash(text, model);
  if (car.embeddingModel === model && car.embeddingHash === hash) return "skipped";

  const { vectors } = await embedTexts({
    feature: AI_FEATURES.carEmbedding,
    texts: [text],
    // Retrieval: a car is the document a buyer's query is matched against.
    task: "document",
    ctx: { ...CALLER, organizationId },
  });
  await carRepository.setCarEmbedding({ id: car.id, organizationId, vector: vectors[0], model, hash });
  return "embedded";
}

/**
 * The backfill: embed a batch of cars with no vector from the current model,
 * in one request. Returns the cursor to continue from, or null when done.
 */
export async function backfillCarEmbeddings(limit: number, after?: string) {
  const model = embeddingModel();
  const cars = await carRepository.findCarsMissingEmbedding(model, limit, after);
  if (cars.length === 0) return { embedded: 0, next: null };

  const texts = cars.map((car) => carEmbeddingText(car));
  const { vectors } = await embedTexts({
    feature: AI_FEATURES.carEmbedding,
    texts,
    task: "document",
    ctx: { ...CALLER, organizationId: null },
  });
  for (const [i, car] of cars.entries()) {
    await carRepository.setCarEmbedding({
      id: car.id,
      organizationId: car.organizationId,
      vector: vectors[i],
      model,
      hash: embeddingHash(texts[i], model),
    });
  }
  return { embedded: cars.length, next: cars.length === limit ? cars.at(-1)!.id : null };
}
