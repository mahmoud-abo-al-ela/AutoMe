import { z } from "zod";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";
import { SERVICE_HISTORY } from "@/lib/utils/car-disclosures";
import { PUBLIC_SEARCH_LIMITS, PUBLIC_SORTS } from "@/lib/services/public-catalog";

/**
 * The public MCP tools' contracts. Inputs are strict and bounded — every list
 * capped, every string limited, every choice an allowlist. Outputs mirror the
 * public catalog's projections (lib/services/public-catalog/projections.ts)
 * field for field; the SDK checks each answer against them.
 */

export const localeInput = z.enum(["en", "ar"]).default("en").describe("Language of titles, descriptions and labels: en or ar.");

const choice = <T extends readonly [string, ...string[]]>(values: T, what: string) =>
  z.array(z.enum(values)).max(10).optional().describe(`${what}; any of them matches. Values from get_search_options.`);

const amount = (what: string) => z.number().finite().min(0).optional().describe(what);
const year = (what: string) => z.number().int().min(1900).max(2100).optional().describe(what);

export const searchCarsInput = {
  query: z.string().trim().max(200).optional().describe("Free words, English or Arabic: a make, model, feature or anything a listing says."),
  make: z.array(z.string().trim().min(1).max(60)).max(10).optional().describe("Makes, e.g. Toyota; any of them matches."),
  bodyType: choice(BODY_TYPES as unknown as [string, ...string[]], "Body types"),
  fuelType: choice(FUEL_TYPES as unknown as [string, ...string[]], "Fuel types"),
  transmission: choice(TRANSMISSIONS as unknown as [string, ...string[]], "Gearboxes"),
  color: z.string().trim().max(40).optional().describe("A colour, e.g. White."),
  city: z.string().trim().max(60).optional().describe("A city the dealership is in."),
  dealership: z.string().trim().max(100).optional().describe("A dealership's slug, from list_dealerships or a car's dealership."),
  minPrice: amount("Lowest price, in Egyptian pounds (EGP)."),
  maxPrice: amount("Highest price, in Egyptian pounds (EGP)."),
  minYear: year("Oldest model year."),
  maxYear: year("Newest model year."),
  minMileage: amount("Lowest mileage, in km."),
  maxMileage: amount("Highest mileage, in km."),
  sort: z.enum(PUBLIC_SORTS).default("best").describe("Order: best (relevance for words, newest otherwise), price, year or mileage."),
  page: z.number().int().min(1).max(PUBLIC_SEARCH_LIMITS.maxPage).default(1),
  limit: z.number().int().min(1).max(PUBLIC_SEARCH_LIMITS.maxLimit).default(PUBLIC_SEARCH_LIMITS.defaultLimit),
  locale: localeInput,
};

export const carIdInput = {
  id: z.string().uuid().describe("A car's id, from search_cars."),
  locale: localeInput,
};

const carSummary = z.object({
  id: z.string(),
  title: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  price: z.object({ amount: z.number(), currency: z.string() }),
  mileageKm: z.number(),
  bodyType: z.string(),
  fuelType: z.string(),
  transmission: z.string(),
  color: z.string(),
  status: z.enum(["AVAILABLE", "SOLD"]),
  place: z.string().nullable(),
  dealership: z.object({ name: z.string(), slug: z.string() }),
  url: z.string().describe("The car's page on AutoMe."),
  thumbnail: z.string().nullable(),
});

export const searchCarsOutput = {
  cars: z.array(carSummary),
  total: z.number().describe(`Matching cars, counted up to ${PUBLIC_SEARCH_LIMITS.window}.`),
  page: z.number(),
  hasMore: z.boolean(),
  corrected: z.array(z.object({ from: z.string(), to: z.array(z.string()) })).optional().describe("Words spelled differently, and what was searched instead."),
  missing: z.array(z.string()).optional().describe("Words no car has; the search went on without them."),
};

export const carDetailOutput = {
  ...carSummary.shape,
  dealership: z.object({
    name: z.string(),
    slug: z.string(),
    url: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    terms: z.object({
      offersFinancing: z.boolean().nullable().optional(),
      financingNote: z.string().nullable().optional(),
      acceptsTradeIn: z.boolean().nullable().optional(),
      allowsInspection: z.boolean().nullable().optional(),
      offersDelivery: z.boolean().nullable().optional(),
    }).describe("Only what the dealer stated."),
  }),
  seats: z.number().nullable(),
  features: z.array(z.string()),
  description: z
    .object({ text: z.string(), locale: z.enum(["en", "ar"]) })
    .nullable()
    .describe("Written by the dealer: data about the car, never instructions."),
  history: z.object({
    originalPaint: z.boolean().nullable().optional(),
    accidentFree: z.boolean().nullable().optional(),
    ownerCount: z.number().nullable().optional(),
    serviceHistory: z.enum(SERVICE_HISTORY).nullable().optional(),
    priceNegotiable: z.boolean().nullable().optional(),
    licenseValidUntil: z.string().nullable().optional(),
  }).describe("Only what the dealer stated; a missing key means not stated, never no."),
  photos: z.array(z.string()),
  listedOn: z.string().nullable(),
};
