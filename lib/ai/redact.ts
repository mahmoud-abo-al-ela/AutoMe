import { createHash } from "node:crypto";
import type { AiPart } from "@/lib/ai/provider/types";

const REDACTIONS: [RegExp, string][] = [
  [/https?:\/\/\S+|www\.\S+/gi, "[link]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
  // A phone as Egyptians write one — a leading 0 (or ٠) or +, then six or more
  // digits with spaces or dashes. A price never starts with 0, so 1250000
  // stays a number the trace can be read by.
  [/(?:\+|[0٠۰])[0-9٠-٩۰-۹](?:[\s-]?[0-9٠-٩۰-۹]){5,}/g, "[phone]"],
];

const MAX_CHARS = 20_000;

export function redactText(text: string): string {
  const redacted = REDACTIONS.reduce((out, [pattern, label]) => out.replace(pattern, label), text);
  return redacted.length > MAX_CHARS ? `${redacted.slice(0, MAX_CHARS)}…[truncated]` : redacted;
}

/** The data parts of a request, as a trace keeps them. */
export function redactParts(parts: AiPart[]): string {
  return redactText(
    parts
      .map((part) => {
        if ("text" in part) return part.text;
        const { data, mimeType } = part.inlineData;
        const digest = createHash("sha256").update(data).digest("hex").slice(0, 16);
        const bytes = Math.floor((data.length * 3) / 4);
        return `[image ${mimeType}, ${bytes} bytes, sha256 ${digest}]`;
      })
      .join("\n---\n")
  );
}
