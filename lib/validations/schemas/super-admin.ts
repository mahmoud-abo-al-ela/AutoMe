import { z } from "zod";
import { isValidSlug } from "@/lib/utils/slug";
import { findCity } from "@/lib/locations/data";
import { optionalEmail, optionalText } from "./fields";

/**
 * A dealership a platform admin adds (super-admin "Add a dealership"): where
 * it is and who owns it are required — buyers search by governorate and area,
 * and a dealership nobody can sign in to is one nobody can run. The area has
 * to be in the governorate given.
 */
export const createDealershipSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().refine(isValidSlug, "Invalid web address"),
    description: optionalText(1000),
    region: z.string().trim().regex(/^[A-Z]{2,4}$/),
    city: z.string().trim().min(1).max(80),
    address: optionalText(200),
    phone: optionalText(40),
    email: optionalEmail,
    website: optionalText(200),
    planId: z.string().trim().min(1).max(64),
    ownerEmail: z.string().trim().toLowerCase().email().max(254),
  })
  .refine((value) => findCity(value.city)?.governorate === value.region, { path: ["city"], message: "Area is not in that governorate" });

/** A plan limit: a count of one or more, or -1 for no limit. */
const planLimit = z.number().int().refine((value) => value === -1 || (value >= 1 && value <= 100_000), "A limit is 1 or more, or -1 for none");

/**
 * One plan's settings as the super-admin edits them (plans page, "Edit"):
 * prices in piasters, limits with -1 for none, how long activity is kept in
 * days or null for always, and the features the app enforces.
 */
export const planSettingsSchema = z.object({
  monthlyPrice: z.number().int().min(0).max(100_000_000),
  yearlyPrice: z.number().int().min(0).max(1_000_000_000),
  trialDays: z.number().int().min(0).max(365),
  maxCars: planLimit,
  maxMembers: planLimit,
  maxImagesPerCar: z.number().int().min(1).max(100),
  auditLogRetentionDays: z.number().int().min(1).max(3650).nullable(),
  aiProcessing: z.object({ enabled: z.boolean(), limit: planLimit.or(z.literal(0)) }),
  aiAssistant: z.boolean(),
  prioritySupport: z.boolean(),
});
