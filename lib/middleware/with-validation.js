import { z } from "zod";
import { ValidationError } from "@/lib/utils/errors";

/**
 * Validates data against a Zod schema and throws a standardized ValidationError if it fails.
 */
export function validateAction(schema, data) {
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
