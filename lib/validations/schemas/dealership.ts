import { z } from "zod";
import { isValidSlug } from "@/lib/utils/slug";
import { optionalEmail, optionalText } from "./fields";

export const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().refine(isValidSlug, "Slug must be 3–50 lowercase letters or numbers, with single hyphens between words"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  // Structured location, captured in onboarding step 1 so an organization is
  // filterable by city from the moment it is created.
  country: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  planId: z.string().min(1, "Plan ID is required"),
  workingHours: z.record(
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    })
  ).optional(),
  userId: z.string().optional(),
  // Only read for a trial: the period its first payment will be for.
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
});

export const organizationProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: optionalEmail,
  phone: optionalText(40),
  website: optionalText(200),
  address: optionalText(240),
  description: optionalText(1000),
  city: optionalText(80),
  region: optionalText(80),
  country: z.string().trim().length(2, "Country must be a 2-letter ISO code").toUpperCase(),
});

/** The dealership's email settings: the weekly summary, and the language of its emails. */
export const emailPreferencesSchema = z.object({
  emailLocale: z.enum(["ar", "en"]),
  weeklyDigestEnabled: z.boolean(),
});

export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;

/**
 * A dealership's standing terms for buyers — see lib/utils/car-disclosures.
 * The financing note is short because the buyer assistant sends it with every
 * question asked on the dealer's listings.
 */
export const dealershipTermsSchema = z.object({
  offersFinancing: z.boolean().nullable(),
  financingNote: z.string().trim().max(200).nullable(),
  acceptsTradeIn: z.boolean().nullable(),
  allowsInspection: z.boolean().nullable(),
  offersDelivery: z.boolean().nullable(),
});

export type DealershipTermsInput = z.infer<typeof dealershipTermsSchema>;

export const dealershipReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Rating is required").max(5),
  title: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type DealershipReviewInput = z.infer<typeof dealershipReviewSchema>;

/**
 * A public dealership page's own reads (getDealershipCars, its filters, its
 * reviews). The dealership is named by its slug and resolved server side to an
 * active one — a request never names a dealership by id, or a suspended one's
 * stock would be one call away.
 */
export const dealershipSlugSchema = z.string().trim().min(1).max(100);

const word = z.string().trim().max(60);
const amount = z.number().finite().min(0).optional();

export const dealershipCarFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  make: word.optional(),
  model: word.optional(),
  minPrice: amount,
  maxPrice: amount,
  minYear: z.number().int().min(1900).max(2100).optional(),
  maxYear: z.number().int().min(1900).max(2100).optional(),
  // Comma-separated, as the page's multi-select sends them ("Sedan,SUV").
  fuelType: z.string().trim().max(200).optional(),
  transmission: z.string().trim().max(200).optional(),
  bodyType: z.string().trim().max(200).optional(),
  sortBy: z.enum(["newest", "createdAt", "priceAsc", "priceDesc", "price", "year", "mileage"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/** A page of a public list: the page sizes the dealership page uses, with headroom. */
export const publicPageSchema = z.object({
  page: z.number().int().min(1).max(10_000).optional(),
  limit: z.number().int().min(1).max(48).optional(),
});

export type DealershipCarFiltersInput = z.infer<typeof dealershipCarFiltersSchema>;
export type PublicPageInput = z.infer<typeof publicPageSchema>;
