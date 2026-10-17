import { z } from "zod";
import { ValidationError } from "@/lib/utils/errors";

export function validateAction<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): z.infer<S> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      const path = firstError.path.join(".");
      // The schema messages are English and name fields by their code
      // path, so the reader gets a translated generic and the specific
      // message stays on `message` for logs. Forms validate client-side with
      // translated per-field messages first; this is the backstop.
      throw new ValidationError(
        path ? `${path}: ${firstError.message}` : firstError.message,
        path,
        { key: "errors.invalidInput" }
      );
    }
    throw error;
  }
}
