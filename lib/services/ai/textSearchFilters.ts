import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { textSearchPrompt } from "@/lib/ai/prompts/text-search";
import { textSearchSchema, type TextSearchExtraction } from "@/lib/ai/schemas/text-search";
import { textPart } from "@/lib/ai/provider/types";
import { CAR_COLORS } from "@/lib/constants/car-options";
import enCarAttributes from "@/messages/en/carAttributes.json";

export interface TextSearchFilters {
  make?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  minSeats?: number;
  /** What the text search should still look for; absent when nothing is left. */
  keywords?: string;
}

const MAKES = new Map(Object.keys(enCarAttributes.make).map((make) => [make.toLowerCase(), make]));
const COLORS = new Map(CAR_COLORS.map((color) => [color.toLowerCase(), color]));

const text = (value: string) => value.trim() || undefined;
const amount = (value: number | null) => (value === null || value <= 0 ? undefined : value);

/** A low/high pair the right way round, whichever way the model wrote it. */
function ordered(low: number | undefined, high: number | undefined): [number | undefined, number | undefined] {
  return low !== undefined && high !== undefined && low > high ? [high, low] : [low, high];
}

export function normalizeTextSearch(extraction: TextSearchExtraction): TextSearchFilters {
  const keywords: string[] = [];
  const make = text(extraction.make);
  const knownMake = make ? MAKES.get(make.toLowerCase()) : undefined;
  if (make && !knownMake) keywords.push(make);
  const color = text(extraction.color);
  const knownColor = color ? COLORS.get(color.toLowerCase()) : undefined;
  if (color && !knownColor) keywords.push(color);
  const rest = text(extraction.keywords);
  if (rest) keywords.unshift(rest);

  const [minPrice, maxPrice] = ordered(amount(extraction.minPrice), amount(extraction.maxPrice));
  const [minYear, maxYear] = ordered(extraction.minYear ?? undefined, extraction.maxYear ?? undefined);

  const filters: TextSearchFilters = {
    make: knownMake,
    bodyType: text(extraction.bodyType),
    fuelType: text(extraction.fuelType),
    transmission: text(extraction.transmission),
    color: knownColor,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    maxMileage: amount(extraction.maxMileage),
    minSeats: extraction.minSeats ?? undefined,
    keywords: keywords.join(" ").trim() || undefined,
  };
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined)) as TextSearchFilters;
}

/** What a buyer typed, as filters plus the words still to search for. */
export async function extractTextSearchFilters(query: string, ctx: AiCallerContext): Promise<TextSearchFilters> {
  const extraction = await generateStructured({
    feature: AI_FEATURES.searchFiltersFromText,
    // A buyer is waiting on the home page: the fast chain.
    task: "textFast",
    system: textSearchPrompt.text,
    parts: [textPart(JSON.stringify(query))],
    schema: textSearchSchema,
    promptVersion: textSearchPrompt.version,
    ctx,
    // Public text, no tenant content: the shared cache answers a repeat.
    cacheBytes: query.trim().toLowerCase(),
    thinking: "low",
    temperature: 0,
    firstTokenTimeoutMs: 6_000,
  });
  return normalizeTextSearch(extraction);
}
