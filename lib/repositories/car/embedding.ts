// Car repository - meaning-based reads and writes (pgvector)
import { db } from "@/lib/prisma";
import { toVectorLiteral } from "@/lib/ai/embeddings";

/** The columns a car's embedding text is made from. */
const TEXT_FIELDS = {
  make: true,
  model: true,
  year: true,
  bodyType: true,
  fuelType: true,
  title: true,
  titleEn: true,
  titleAr: true,
  description: true,
  descriptionEn: true,
  descriptionAr: true,
  features: true,
  featuresAr: true,
} as const;

/** One car for the car-embedding job, scoped to its dealership; null when gone. */
export function findCarForEmbedding(id: string, organizationId: string) {
  return db.car.findFirst({
    where: { id, organizationId },
    select: { id: true, organizationId: true, embeddingModel: true, embeddingHash: true, ...TEXT_FIELDS },
  });
}

export async function setCarEmbedding(input: {
  id: string;
  organizationId: string;
  vector: number[];
  model: string;
  hash: string;
}) {
  await db.$executeRaw`
    UPDATE "Car"
    SET "embedding" = ${toVectorLiteral(input.vector)}::vector,
        "embeddingModel" = ${input.model},
        "embeddingHash" = ${input.hash}
    WHERE "id" = ${input.id} AND "organizationId" = ${input.organizationId}`;
}

export function findCarsMissingEmbedding(model: string, take: number, after?: string) {
  return db.car.findMany({
    where: {
      OR: [{ embeddingModel: null }, { embeddingModel: { not: model } }],
      ...(after && { id: { gt: after } }),
    },
    orderBy: { id: "asc" },
    take,
    select: { id: true, organizationId: true, ...TEXT_FIELDS },
  });
}
