import { createHash } from "node:crypto";

export interface CarForEmbedding {
  make: string;
  model: string;
  year: number;
  bodyType: string;
  fuelType: string;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  features: string[];
  featuresAr: string[];
}

/** Long descriptions are clipped: the opening says what the car is. */
const MAX_DESCRIPTION = 1_200;

function clip(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_DESCRIPTION ? trimmed.slice(0, MAX_DESCRIPTION) : trimmed;
}

export function carEmbeddingText(car: CarForEmbedding): string {
  const lines = [
    `${car.year} ${car.make} ${car.model}, ${car.bodyType}, ${car.fuelType}`,
    clip(car.descriptionEn ?? car.description),
    clip(car.descriptionAr),
    car.features.length > 0 ? car.features.join(", ") : null,
    car.featuresAr.length > 0 ? car.featuresAr.join("، ") : null,
  ];
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

/** Fingerprint of the text and the model, so an unchanged car is not re-embedded. */
export function embeddingHash(text: string, model: string): string {
  return createHash("sha256").update(model).update("\0").update(text).digest("hex");
}
