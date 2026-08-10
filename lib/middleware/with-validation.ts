import { z } from "zod";
import { ValidationError } from "@/lib/utils/errors";

/**
 * Validates data against a Zod schema and throws a standardized ValidationError if it fails.
 * Returns the parsed, typed value (z.infer of the schema).
 *
 * Generic over the schema rather than over one type parameter: schemas built
 * with z.preprocess have different input and output types, and inferring a
 * single T collapses them onto the (unknown) input side.
 */
export function validateAction<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): z.infer<S> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const path = firstError.path.join(".");
      throw new ValidationError(
        path ? `${path}: ${firstError.message}` : firstError.message,
        path
      );
    }
    throw error;
  }
}
