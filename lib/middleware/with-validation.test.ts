import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateAction } from "@/lib/middleware/with-validation";
import { ValidationError } from "@/lib/utils/errors";

const schema = z.object({
  make: z.string().min(1),
  year: z.number().int().min(1900),
});

describe("validateAction", () => {
  it("returns the parsed value on valid input", () => {
    const parsed = validateAction(schema, { make: "Toyota", year: 2020 });
    expect(parsed).toEqual({ make: "Toyota", year: 2020 });
  });

  it("strips unknown keys per the Zod schema", () => {
    const parsed = validateAction(schema, { make: "Toyota", year: 2020, evil: "x" });
    expect(parsed).not.toHaveProperty("evil");
  });

  it("throws ValidationError carrying the failing field path", () => {
    try {
      validateAction(schema, { make: "", year: 2020 });
      throw new Error("expected validateAction to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as { field?: unknown }).field).toBe("make");
      expect((err as { code?: unknown }).code).toBe("VALIDATION_ERROR");
    }
  });

  it("reports the field for a wrong-type value", () => {
    try {
      validateAction(schema, { make: "Toyota", year: "not-a-number" });
      throw new Error("expected validateAction to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as { field?: unknown }).field).toBe("year");
    }
  });
});
