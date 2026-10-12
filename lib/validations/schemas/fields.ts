import { z } from "zod";
import { normalizeCarStatus } from "@/lib/constants/car-options";

/** Field shapes more than one domain's schemas share. */

/**
 * Either spelling in, the database enum out — see normalizeCarStatus. An
 * unknown value is left as-is so the enum rejects it with a real error.
 */
export const carStatus = z
  .preprocess(
    (value) => normalizeCarStatus(value) ?? value,
    z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"])
  )
  .optional();

export const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).optional().nullable()
  );

export const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().email("Invalid email address").max(120).optional().nullable()
);
