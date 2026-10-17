import { z } from "zod";

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
