import { z } from "zod";
import arCarAttributes from "@/messages/ar/carAttributes.json";
import { SPECS, type SpecKind } from "@/lib/search/specs";
import { PUBLIC_SEARCH_LIMITS, PUBLIC_SORTS } from "@/lib/services/public-catalog";
import type { PublicTool } from "../tool";

/**
 * What search_cars accepts: the makes, body types, fuels, gearboxes and colours
 * the site knows, each as the value to send and its name in the reader's
 * language, plus the sorts and limits. Static — built from the site's own
 * lists, with no database read — so it is the same for every caller.
 */

const AR_MAKES = (arCarAttributes as unknown as { make: Record<string, string> }).make;

const option = z.object({ value: z.string(), label: z.string() });

const inputSchema = {
  locale: z.enum(["en", "ar"]).default("en").describe("Language for the labels: en or ar."),
};

const outputSchema = {
  makes: z.array(option),
  bodyTypes: z.array(option),
  fuelTypes: z.array(option),
  transmissions: z.array(option),
  colors: z.array(option),
  sorts: z.array(z.string()),
  limits: z.object({ maxResultsPerPage: z.number(), maxPage: z.number(), maxResults: z.number() }),
};

type Options = z.objectOutputType<typeof outputSchema, z.ZodTypeAny>;

function specsOf(kind: SpecKind, locale: "en" | "ar") {
  return SPECS.filter((spec) => spec.kind === kind).map((spec) => ({ value: spec.value, label: locale === "ar" ? spec.ar : spec.en }));
}

/** One answer per language, built once. */
const answers = new Map<"en" | "ar", Options>();

function optionsFor(locale: "en" | "ar"): Options {
  let answer = answers.get(locale);
  if (!answer) {
    answer = {
      makes: Object.entries(AR_MAKES).map(([value, ar]) => ({ value, label: locale === "ar" ? ar : value })),
      bodyTypes: specsOf("bodyType", locale),
      fuelTypes: specsOf("fuelType", locale),
      transmissions: specsOf("transmission", locale),
      colors: specsOf("color", locale),
      sorts: [...PUBLIC_SORTS],
      limits: {
        maxResultsPerPage: PUBLIC_SEARCH_LIMITS.maxLimit,
        maxPage: PUBLIC_SEARCH_LIMITS.maxPage,
        maxResults: PUBLIC_SEARCH_LIMITS.window,
      },
    };
    answers.set(locale, answer);
  }
  return answer;
}

export const searchOptionsTool: PublicTool<typeof inputSchema, typeof outputSchema> = {
  name: "get_search_options",
  title: "AutoMe search options",
  description:
    "Lists what AutoMe's car search accepts: makes, body types, fuel types, gearboxes and colours " +
    "(each with the value to send and a label in English or Arabic), the sort orders, and the paging limits. " +
    "AutoMe is a car marketplace in Egypt; prices are in Egyptian pounds (EGP).",
  inputSchema,
  outputSchema,
  run: async ({ locale }) => ({ structured: optionsFor(locale) }),
};
