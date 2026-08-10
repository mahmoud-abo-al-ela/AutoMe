// Parse structured JSON out of LLM text output.

/**
 * Extract and parse the first brace-balanced JSON object from model output.
 *
 * Tolerant of code fences, surrounding prose, and trailing junk — notably the
 * spurious extra "}" gemini-3.5-flash appends even with responseMimeType JSON,
 * which defeats both a bare JSON.parse and a greedy /{[\s\S]*}/ match. Braces
 * inside strings are ignored so quoted "{"/"}" don't throw off the depth count.
 *
 * @param {string} text - Raw model text.
 * @returns {object} The parsed object.
 * @throws {SyntaxError} If no complete, parseable object is found.
 */
export function parseFirstJsonObject(text: unknown): Record<string, unknown> {
  if (typeof text !== "string") {
    throw new SyntaxError("AI response is empty");
  }

  const start = text.indexOf("{");
  if (start === -1) {
    throw new SyntaxError("No JSON object found in AI response");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }

  throw new SyntaxError("No complete JSON object found in AI response");
}
