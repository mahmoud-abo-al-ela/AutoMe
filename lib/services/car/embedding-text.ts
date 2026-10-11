import { createHash } from "node:crypto";
import arCarAttributes from "@/messages/ar/carAttributes.json";

/**
 * The text a car's meaning is made from, for meaning-based search.
 *
 * In both languages, because buyers search in both and a vector compares best
 * with text in the same language: specs with their Arabic names, and the
 * dealer's own title, description and features as they wrote them in each.
 * Price, mileage and year-as-a-number are left out — a buyer's "under a
 * million" is a filter, not a meaning, and numbers make poor vectors.
 */

export interface CarForEmbedding {
  make: string;
  model: string;
  year: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  color: string;
  seats: number | null;
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

const ar = arCarAttributes as Record<string, Record<string, string>>;
const arabic = (group: string, value: string) => ar[group]?.[value] ?? ar[group]?.[value.toLowerCase()];

function clip(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_DESCRIPTION ? trimmed.slice(0, MAX_DESCRIPTION) : trimmed;
}

export function carEmbeddingText(car: CarForEmbedding): string {
  const specs = [
    `${car.year} ${car.make} ${car.model}`,
    car.bodyType,
    car.fuelType,
    car.transmission,
    car.color,
    car.seats ? `${car.seats} seats` : null,
  ];
  const specsAr = [
    [arabic("make", car.make), car.model].filter(Boolean).join(" "),
    arabic("body", car.bodyType),
    arabic("fuel", car.fuelType),
    arabic("transmission", car.transmission),
    arabic("color", car.color),
  ];
  const lines = [
    specs.filter(Boolean).join(", "),
    specsAr.filter(Boolean).join("، "),
    clip(car.titleEn ?? car.title),
    clip(car.titleAr),
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
