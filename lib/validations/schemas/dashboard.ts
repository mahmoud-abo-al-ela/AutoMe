import { z } from "zod";
import { carStatus } from "./fields";

export const INVENTORY_VIEWS = ["all", "available", "unavailable", "sold"] as const;
export const INVENTORY_SORTS = ["listed", "price", "saves", "drives"] as const;
export const INVENTORY_PAGE_SIZE = 20;
export const inventorySchema = z.object({
  view: z.enum(INVENTORY_VIEWS).default("all"),
  search: z.string().trim().max(100).optional(),
  bodyType: z.string().trim().max(40).optional(),
  minYear: z.coerce.number().int().min(1900).max(2100).optional(),
  featured: z.boolean().optional(),
  sort: z.enum(INVENTORY_SORTS).default("listed"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
});
export type InventoryInput = z.infer<typeof inventorySchema>;

/** Several of the dealer's cars changed at once from the Cars table: a status, featured, or both. */
export const bulkCarUpdateSchema = z
  .object({
    carIds: z.array(z.string().min(1).max(64)).min(1).max(100),
    status: carStatus,
    featured: z.boolean().optional(),
  })
  .refine((value) => value.status !== undefined || value.featured !== undefined, { message: "Nothing to change" });

/** A month of the Test drives calendar ("2026-10") and one of its days ("2026-10-07"). */
export const scheduleMonthSchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
export const scheduleDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)),
});

/** A conversation's buyer (their user id, which is also their Stream id) and the car it is about. */
export const dealContextSchema = z.object({
  buyerId: z.string().min(1).max(64),
  carId: z.string().min(1).max(64).nullish(),
});

/** The Insights page's period, in days: the three the period picker offers. */
export const INSIGHT_PERIODS = [7, 30, 90] as const;
export const insightsSchema = z.object({
  days: z.coerce.number().refine((value) => (INSIGHT_PERIODS as readonly number[]).includes(value)),
});
