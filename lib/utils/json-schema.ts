import { z } from "zod";

/**
 * A Zod schema as the plain JSON Schema that models and browser agents read:
 * Gemini's response schema, and the input schema of a WebMCP tool.
 *
 * - The input side (`io: "input"`): what the other party writes is what the
 *   schema then parses, so a coerced or transformed field is described by what
 *   it accepts, not by what it becomes.
 * - Draft 7 and everything inlined: Gemini accepts `$ref`/`$defs` only in a
 *   limited form, and `$schema` is not in the subset it documents — it is
 *   rejected, not ignored.
 * - A type JSON Schema cannot express (a date, a custom check) becomes `{}`
 *   rather than throwing.
 *
 * Two touches keep the output what zod-to-json-schema produced under Zod 3, so
 * the move to Zod 4 changed nothing a model is sent: every object is closed
 * (`additionalProperties: false`) as before, and the ±2^53 bounds Zod 4 puts
 * on every `.int()` are dropped — they say nothing, and cost tokens.
 */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema, {
    target: "draft-07",
    io: "input",
    unrepresentable: "any",
    reused: "inline",
    cycles: "throw",
  }) as Record<string, unknown>;
  return asBefore(json) as Record<string, unknown>;
}

function asBefore(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(asBefore);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "maximum" && value === Number.MAX_SAFE_INTEGER) continue;
    if (key === "minimum" && value === Number.MIN_SAFE_INTEGER) continue;
    out[key] = asBefore(value);
  }
  if (out.type === "object" && out.properties && !("additionalProperties" in out)) {
    out.additionalProperties = false;
  }
  return out;
}
