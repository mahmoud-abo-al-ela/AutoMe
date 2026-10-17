// Parse structured JSON out of LLM text output.

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
